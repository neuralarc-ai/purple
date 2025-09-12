"""
Stripe Billing API implementation for Helium on top of Basejump. ONLY HAS SUPPOT FOR USER ACCOUNTS – no team accounts. As we are using the user_id as account_id as is the case with personal accounts. In personal accounts, the account_id equals the user_id. In team accounts, the account_id is unique.

stripe listen --forward-to localhost:8000/api/billing/webhook
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, Dict, Tuple
import stripe
from datetime import datetime, timezone, timedelta

from supabase import Client as SupabaseClient
from utils.cache import Cache
from utils.logger import logger
from utils.config import config, EnvMode
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from pydantic import BaseModel
from utils.constants import MODEL_ACCESS_TIERS, MODEL_NAME_ALIASES, HARDCODED_MODEL_PRICES
from litellm.cost_calculator import cost_per_token
import time

# Initialize Stripe
stripe.api_key = config.STRIPE_SECRET_KEY

# Token price multiplier
TOKEN_PRICE_MULTIPLIER = 1.5

# Minimum credits required to allow a new request when over subscription limit
CREDIT_MIN_START_DOLLARS = 0.20

# Credit packages with Stripe price IDs
CREDIT_PACKAGES = {
    'credits_test': {'amount': 500, 'price': 1.00, 'stripe_price_id': config.STRIPE_CREDITS_TEST_PRICE_ID},
    'credits_small': {'amount': 1000, 'price': 11.99, 'stripe_price_id': config.STRIPE_CREDITS_SMALL_PRICE_ID},
    'credits_medium': {'amount': 2500, 'price': 28.99, 'stripe_price_id': config.STRIPE_CREDITS_MEDIUM_PRICE_ID},
    'credits_large': {'amount': 5000, 'price': 55.99, 'stripe_price_id': config.STRIPE_CREDITS_LARGE_PRICE_ID},
}

router = APIRouter(prefix="/billing", tags=["billing"])

def get_plan_info(price_id: str) -> dict:
    PLAN_TIERS = {
        config.STRIPE_TIER_RIDICULOUSLY_CHEAP_ID: {'tier': 1, 'type': 'monthly', 'name': 'Outrageously Smart - $24.99/month'},
        config.STRIPE_TIER_SERIOUS_BUSINESS_ID: {'tier': 2, 'type': 'monthly', 'name': 'Supremely Serious - $94.99/month'},
        
        # Yearly plans
        config.STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID: {'tier': 1, 'type': 'yearly', 'name': 'Outrageously Smart - $254.89/year'},
        config.STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID: {'tier': 2, 'type': 'yearly', 'name': 'Supremely Serious - $968.88/year'},
    }
    
    return PLAN_TIERS.get(price_id, {'tier': 0, 'type': 'unknown', 'name': 'Unknown'})

def is_plan_change_allowed(current_price_id: str, new_price_id: str) -> tuple[bool, str]:
    """
    Validate if a plan change is allowed based on business rules.
    
    Returns:
        Tuple of (is_allowed, reason_if_not_allowed)
    """
    current_plan = get_plan_info(current_price_id)
    new_plan = get_plan_info(new_price_id)
    
    # Allow if same plan
    if current_price_id == new_price_id:
        return True, ""
    
    # Restriction: Don't allow downgrade from monthly to lower monthly
    if current_plan['type'] == 'monthly' and new_plan['type'] == 'monthly' and new_plan['tier'] < current_plan['tier']:
        return False, "Downgrading to a lower monthly plan is not allowed. You can only upgrade to a higher tier or switch to yearly billing."
    
    # Restriction: Don't allow downgrade from yearly to lower yearly
    if current_plan['type'] == 'yearly' and new_plan['type'] == 'yearly' and new_plan['tier'] < current_plan['tier']:
        return False, "Downgrading to a lower yearly plan is not allowed. You can only upgrade to higher yearly tiers."
    
    # Allow all other changes (upgrades, monthly to yearly, yearly to monthly, etc.)
    return True, ""

# Simplified yearly commitment logic - no subscription schedules needed

def get_model_pricing(model: str) -> tuple[float, float] | None:
    """
    Get pricing for a model. Returns (input_cost_per_million, output_cost_per_million) or None.
    
    Args:
        model: The model name to get pricing for
        
    Returns:
        Tuple of (input_cost_per_million_tokens, output_cost_per_million_tokens) or None if not found
    """
    if model in HARDCODED_MODEL_PRICES:
        pricing = HARDCODED_MODEL_PRICES[model]
        return pricing["input_cost_per_million_tokens"], pricing["output_cost_per_million_tokens"]
    return None


SUBSCRIPTION_TIERS = {
    config.STRIPE_FREE_TIER_ID: {'name': 'free', 'minutes': 60, 'cost': 15.00},  # 1,500 credits = $15.00
    # Monthly tiers
    config.STRIPE_TIER_RIDICULOUSLY_CHEAP_ID: {'name': 'tier_ridiculously_cheap', 'minutes': 120, 'cost': 45.00},  # 4,500 credits/month
    config.STRIPE_TIER_SERIOUS_BUSINESS_ID: {'name': 'tier_serious_business', 'minutes': 360, 'cost': 115.00},  # 11,500 credits/month
    # Yearly tiers (same usage limits, different billing period) - displayed as monthly equivalent
    config.STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID: {'name': 'tier_ridiculously_cheap', 'minutes': 120, 'cost': 540.00},  # 54,000 credits/month (billed yearly)
    config.STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID: {'name': 'tier_serious_business', 'minutes': 360, 'cost': 1380.00},  # 138,000 credits/month (billed yearly)
}

# Pydantic models for request/response validation
class CreateCheckoutSessionRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str
    tolt_referral: Optional[str] = None
    commitment_type: Optional[str] = "monthly"  # "monthly" or "yearly"

class CreatePortalSessionRequest(BaseModel):
    return_url: str

class SubscriptionStatus(BaseModel):
    status: str # e.g., 'active', 'trialing', 'past_due', 'scheduled_downgrade', 'no_subscription'
    plan_name: Optional[str] = None
    price_id: Optional[str] = None # Added price ID
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    trial_end: Optional[datetime] = None
    minutes_limit: Optional[int] = None
    cost_limit: Optional[float] = None
    current_usage: Optional[float] = None
    # Fields for scheduled changes
    has_schedule: bool = False
    scheduled_plan_name: Optional[str] = None
    scheduled_price_id: Optional[str] = None # Added scheduled price ID
    scheduled_change_date: Optional[datetime] = None
    # Subscription data for frontend components
    subscription_id: Optional[str] = None
    subscription: Optional[Dict] = None
    # Credit information
    credit_balance: Optional[float] = None
    credit_balance_credits: Optional[int] = None
    credit_total_purchased: Optional[float] = None
    credit_total_used: Optional[float] = None
    can_purchase_credits: bool = False

class PurchaseCreditsRequest(BaseModel):
    amount_dollars: float  # Amount of credits to purchase in dollars
    success_url: str
    cancel_url: str

class CreditBalance(BaseModel):
    balance_dollars: float
    balance_credits: int  # Add credit amount (1 credit = $0.01)
    total_purchased: float
    total_used: float
    last_updated: Optional[datetime] = None
    can_purchase_credits: bool = False  # True only for highest tier users

class CreditPurchase(BaseModel):
    id: str
    amount_dollars: float
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    stripe_payment_intent_id: Optional[str] = None

class CreditUsage(BaseModel):
    id: str
    amount_dollars: float
    description: Optional[str] = None
    created_at: datetime
    thread_id: Optional[str] = None
    message_id: Optional[str] = None

# Helper functions
async def get_stripe_customer_id(client: SupabaseClient, user_id: str) -> Optional[str]:
    """Get the Stripe customer ID for a user."""

    result = await Cache.get(f"stripe_customer_id:{user_id}")
    if result:
        return result

    # Search for existing customer in Stripe by user_id metadata
    customer_result = await stripe.Customer.search_async(
        query=f"metadata['user_id']:'{user_id}'"
    )

    if customer_result.data and len(customer_result.data) > 0:
        customer = customer_result.data[0]
        customer_id = customer['id']
        
        # If the customer does not have 'user_id' in metadata, add it now
        if not customer.get('metadata', {}).get('user_id'):
            try:
                await stripe.Customer.modify_async(
                    customer_id,
                    metadata={**customer.get('metadata', {}), 'user_id': user_id}
                )
                logger.debug(f"Added missing user_id metadata to Stripe customer {customer_id}")
            except Exception as e:
                logger.error(f"Failed to add user_id metadata to Stripe customer {customer_id}: {str(e)}")

        await Cache.set(f"stripe_customer_id:{user_id}", customer_id, ttl=24 * 60)
        return customer_id

    return None

async def create_stripe_customer(client, user_id: str, email: str) -> str:
    """Create a new Stripe customer for a user."""
    # Create customer in Stripe
    customer = await stripe.Customer.create_async(
        email=email,
        metadata={"user_id": user_id}
    )
    
    return customer.id

async def get_user_subscription(user_id: str) -> Optional[Dict]:
    """Get the current subscription for a user from Stripe."""
    try:
        result = await Cache.get(f"user_subscription:{user_id}")
        if result:
            return result

        # Get customer ID
        db = DBConnection()
        client = await db.client
        customer_id = await get_stripe_customer_id(client, user_id)
        
        if not customer_id:
            await Cache.set(f"user_subscription:{user_id}", None, ttl=1 * 60)
            return None
            
        # Get all active subscriptions for the customer
        subscriptions = await stripe.Subscription.list_async(
            customer=customer_id,
            status='active'
        )
        # print("Found subscriptions:", subscriptions)
        
        # Check if we have any subscriptions
        if not subscriptions or not subscriptions.get('data'):
            await Cache.set(f"user_subscription:{user_id}", None, ttl=1 * 60)
            return None
            
        # Filter subscriptions to only include our product's subscriptions
        our_subscriptions = []
        for sub in subscriptions['data']:
            # Check if subscription items contain any of our price IDs
            for item in sub.get('items', {}).get('data', []):
                price_id = item.get('price', {}).get('id')
                if price_id in [
                    config.STRIPE_FREE_TIER_ID,
                    config.STRIPE_TIER_RIDICULOUSLY_CHEAP_ID, config.STRIPE_TIER_SERIOUS_BUSINESS_ID,
                    # Yearly tiers
                    config.STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID, config.STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID
                ]:
                    our_subscriptions.append(sub)
        
        if not our_subscriptions:
            await Cache.set(f"user_subscription:{user_id}", None, ttl=1 * 60)
            return None
            
        # If there are multiple active subscriptions, we need to handle this
        if len(our_subscriptions) > 1:
            logger.warning(f"User {user_id} has multiple active subscriptions: {[sub['id'] for sub in our_subscriptions]}")
            
            # Get the most recent subscription
            most_recent = max(our_subscriptions, key=lambda x: x['created'])
            
            # Cancel all other subscriptions
            for sub in our_subscriptions:
                if sub['id'] != most_recent['id']:
                    try:
                        await stripe.Subscription.modify_async(
                            sub['id'],
                            cancel_at_period_end=True
                        )
                        logger.debug(f"Cancelled subscription {sub['id']} for user {user_id}")
                    except Exception as e:
                        logger.error(f"Error cancelling subscription {sub['id']}: {str(e)}")
            
            return most_recent

        result = our_subscriptions[0]
        await Cache.set(f"user_subscription:{user_id}", result, ttl=1 * 60)
        return result
        
    except Exception as e:
        logger.error(f"Error getting subscription from Stripe: {str(e)}")
        return None

async def calculate_monthly_usage(client, user_id: str) -> float:
    """Calculate total dollar cost for the current month using durable usage_logs."""
    result = await Cache.get(f"monthly_usage:{user_id}")
    if result is not None:
        return result

    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    try:
        # Sum estimated_cost for this month from usage_logs
        # Supabase PostgREST doesn't support SUM directly with select(); use RPC fallback if present
        # Fallback to client-side sum
        page = 0
        page_size = 1000
        total_cost = 0.0
        while True:
            res = await client.table('usage_logs') \
                .select('estimated_cost, created_at') \
                .eq('user_id', user_id) \
                .gte('created_at', start_of_month.isoformat()) \
                .order('created_at', desc=True) \
                .range(page * page_size, (page + 1) * page_size - 1) \
                .execute()
            if not res.data:
                break
            for row in res.data:
                try:
                    total_cost += float(row.get('estimated_cost') or 0.0)
                except Exception:
                    continue
            if len(res.data) < page_size:
                break
            page += 1

        await Cache.set(f"monthly_usage:{user_id}", total_cost, ttl=5)
        return total_cost
    except Exception as e:
        logger.error(f"Error calculating monthly usage from usage_logs: {str(e)}")
        return 0.0


async def get_usage_logs(client, user_id: str, page: int = 0, items_per_page: int = 1000) -> Dict:
    """Get detailed usage logs for a user with pagination, grouped by thread using usage_logs."""
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # First, get all usage logs for the month to properly aggregate by thread
    all_res = await client.table('usage_logs') \
        .select('thread_id, total_prompt_tokens, total_completion_tokens, total_tokens, estimated_cost, created_at') \
        .eq('user_id', user_id) \
        .gte('created_at', start_of_month.isoformat()) \
        .order('created_at', desc=True) \
        .execute()

    if not all_res.data:
        return {"logs": [], "has_more": False}

    # Get unique thread_ids from all usage data
    thread_ids = [row.get('thread_id') for row in all_res.data if row.get('thread_id')]
    
    # Fetch thread and project information for existing threads
    thread_info = {}
    project_names = {}
    
    if thread_ids:
        # Get thread information
        threads_result = await client.table('threads') \
            .select('thread_id, project_id, created_at') \
            .in_('thread_id', thread_ids) \
            .execute()
        
        # Get project information
        project_ids = [thread['project_id'] for thread in threads_result.data if thread.get('project_id')]
        if project_ids:
            projects_result = await client.table('projects') \
                .select('project_id, name') \
                .in_('project_id', project_ids) \
                .execute()
            
            for project in projects_result.data:
                project_names[project['project_id']] = project['name']
        
        # Build thread info mapping
        for thread in threads_result.data:
            thread_id = thread['thread_id']
            project_id = thread.get('project_id')
            project_name = project_names.get(project_id, 'Unknown Project')
            thread_info[thread_id] = {
                'project_id': project_id,
                'project_name': project_name,
                'created_at': thread['created_at']
            }

    # Aggregate by thread_id
    by_thread: Dict[str, Dict] = {}
    for row in all_res.data:
        thread_id = row.get('thread_id') or 'unknown'
        
        # Determine thread name and status
        if thread_id == 'unknown' or thread_id is None:
            # NULL thread_id entries are from deleted threads (created before migration)
            thread_name = 'Deleted Thread'
        elif thread_id in thread_info:
            # Use project name if available, otherwise show thread ID
            project_name = thread_info[thread_id]['project_name']
            if project_name and project_name != 'Unknown Project':
                thread_name = f"{project_name} Thread"
            else:
                thread_name = f"Thread {thread_id[:8]}..."
        else:
            # Thread ID exists in usage_logs but not in threads table = deleted thread
            thread_name = 'Deleted Thread'
        
        entry = by_thread.setdefault(thread_id, {
            'thread_id': thread_id,
            'project_id': thread_info.get(thread_id, {}).get('project_id') if thread_id in thread_info else None,
            'project_name': thread_name,  # Use thread_name as project_name for display
            'created_at': row.get('created_at'),
            'total_cost_dollars': 0.0,  # Store dollars first, convert to credits later
            'request_count': 0,
            'total_prompt_tokens': 0,
            'total_completion_tokens': 0,
            'total_tokens': 0,
        })
        entry['request_count'] += 1
        entry['total_prompt_tokens'] += int(row.get('total_prompt_tokens') or 0)
        entry['total_completion_tokens'] += int(row.get('total_completion_tokens') or 0)
        entry['total_tokens'] += int(row.get('total_tokens') or 0)
        # Sum dollars first to match calculate_monthly_usage behavior
        entry['total_cost_dollars'] += float(row.get('estimated_cost') or 0.0)
        # Keep latest created_at
        if row.get('created_at') and row.get('created_at') > entry['created_at']:
            entry['created_at'] = row['created_at']

    # Convert dollars to credits after aggregation to match calculate_monthly_usage behavior
    for entry in by_thread.values():
        entry['total_credits'] = round(entry['total_cost_dollars'] * 100)
        # Remove the dollars field to keep the response format consistent
        del entry['total_cost_dollars']
    
    # Sort all logs by created_at
    processed_logs = list(by_thread.values())
    processed_logs.sort(key=lambda x: x['created_at'] or '', reverse=True)
    
    # Apply pagination to the aggregated results
    start_idx = page * items_per_page
    end_idx = start_idx + items_per_page
    paginated_logs = processed_logs[start_idx:end_idx]
    
    has_more = end_idx < len(processed_logs)
    
    return {"logs": paginated_logs, "has_more": has_more}


def calculate_token_cost(prompt_tokens: int, completion_tokens: int, model: str) -> float:
    """Calculate the cost for tokens using the same logic as the monthly usage calculation."""
    try:
        # Ensure tokens are valid integers
        prompt_tokens = int(prompt_tokens) if prompt_tokens is not None else 0
        completion_tokens = int(completion_tokens) if completion_tokens is not None else 0
        
        # Try to resolve the model name using MODEL_NAME_ALIASES first
        resolved_model = MODEL_NAME_ALIASES.get(model, model)

        # Check if we have hardcoded pricing for this model (try both original and resolved)
        hardcoded_pricing = get_model_pricing(model) or get_model_pricing(resolved_model)
        if hardcoded_pricing:
            input_cost_per_million, output_cost_per_million = hardcoded_pricing
            input_cost = (prompt_tokens / 1_000_000) * input_cost_per_million
            output_cost = (completion_tokens / 1_000_000) * output_cost_per_million
            message_cost = input_cost + output_cost
        else:
            # Use litellm pricing as fallback - try multiple variations
            try:
                models_to_try = [model]
                
                # Add resolved model if different
                if resolved_model != model:
                    models_to_try.append(resolved_model)
                
                # Try without provider prefix if it has one
                if '/' in model:
                    models_to_try.append(model.split('/', 1)[1])
                if '/' in resolved_model and resolved_model != model:
                    models_to_try.append(resolved_model.split('/', 1)[1])
                    
                # Special handling for Google models accessed via OpenRouter
                if model.startswith('openrouter/google/'):
                    google_model_name = model.replace('openrouter/', '')
                    models_to_try.append(google_model_name)
                if resolved_model.startswith('openrouter/google/'):
                    google_model_name = resolved_model.replace('openrouter/', '')
                    models_to_try.append(google_model_name)
                
                # Try each model name variation until we find one that works
                message_cost = None
                for model_name in models_to_try:
                    try:
                        prompt_token_cost, completion_token_cost = cost_per_token(model_name, prompt_tokens, completion_tokens)
                        if prompt_token_cost is not None and completion_token_cost is not None:
                            message_cost = prompt_token_cost + completion_token_cost
                            break
                    except Exception as e:
                        logger.debug(f"Failed to get pricing for model variation {model_name}: {str(e)}")
                        continue
                
                if message_cost is None:
                    logger.warning(f"Could not get pricing for model {model} (resolved: {resolved_model}), returning 0 cost")
                    return 0.0
                    
            except Exception as e:
                logger.warning(f"Could not get pricing for model {model} (resolved: {resolved_model}): {str(e)}, returning 0 cost")
                return 0.0
        
        # Apply the TOKEN_PRICE_MULTIPLIER
        return message_cost * TOKEN_PRICE_MULTIPLIER
    except Exception as e:
        logger.error(f"Error calculating token cost for model {model}: {str(e)}")
        return 0.0

async def get_allowed_models_for_user(client, user_id: str):
    """
    Get the list of models allowed for a user based on their subscription tier.
    
    Returns:
        List of model names allowed for the user's subscription tier.
    """

    result = await Cache.get(f"allowed_models_for_user:{user_id}")
    if result:
        return result

    subscription = await get_user_subscription(user_id)
    tier_name = 'free'
    
    if subscription:
        price_id = None
        if subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
            price_id = subscription['items']['data'][0]['price']['id']
        else:
            price_id = subscription.get('price_id', config.STRIPE_FREE_TIER_ID)
        
        # Get tier info for this price_id
        tier_info = SUBSCRIPTION_TIERS.get(price_id)
        if tier_info:
            tier_name = tier_info['name']
    
    # Return allowed models for this tier
    result = MODEL_ACCESS_TIERS.get(tier_name, MODEL_ACCESS_TIERS['free'])  # Default to free tier if unknown
    await Cache.set(f"allowed_models_for_user:{user_id}", result, ttl=1 * 60)
    return result


async def can_use_model(client, user_id: str, model_name: str):
    # Bypass all model access restrictions - allow all models for all users
    logger.debug(f"Model access check bypassed for user {user_id} and model {model_name}")
    return True, "Model access allowed - no restrictions", {
        "price_id": "unrestricted",
        "plan_name": "Unrestricted Access",
        "minutes_limit": "no limit"
    }

async def get_subscription_tier(client, user_id: str) -> str:
    try:
        subscription = await get_user_subscription(user_id)
        
        if not subscription:
            return 'free'
        
        price_id = None
        if subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
            price_id = subscription['items']['data'][0]['price']['id']
        else:
            price_id = subscription.get('price_id', config.STRIPE_FREE_TIER_ID)
        
        tier_info = SUBSCRIPTION_TIERS.get(price_id)
        if tier_info:
            return tier_info['name']
        
        logger.warning(f"Unknown price_id {price_id} for user {user_id}, defaulting to free tier")
        return 'free'
        
    except Exception as e:
        logger.error(f"Error getting subscription tier for user {user_id}: {str(e)}")
        return 'free'

async def check_billing_status(client, user_id: str) -> Tuple[bool, str, Optional[Dict]]:
    """
    Check if a user can run agents based on their subscription and usage.
    Now also checks credit balance if subscription limit is exceeded.
    
    Returns:
        Tuple[bool, str, Optional[Dict]]: (can_run, message, subscription_info)
    """
    if config.ENV_MODE == EnvMode.LOCAL:
        logger.debug("Running in local development mode - billing checks are disabled")
        return True, "Local development mode - billing disabled", {
            "price_id": "local_dev",
            "plan_name": "Local Development",
            "minutes_limit": "no limit"
        }

    # Get current subscription
    subscription = await get_user_subscription(user_id)
    # print("Current subscription:", subscription)
    
    # If no subscription, they can use free tier
    if not subscription:
        subscription = {
            'price_id': config.STRIPE_FREE_TIER_ID,  # Free tier
            'plan_name': 'free'
        }
    
    # Extract price ID from subscription items
    price_id = None
    if subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
        price_id = subscription['items']['data'][0]['price']['id']
    else:
        price_id = subscription.get('price_id', config.STRIPE_FREE_TIER_ID)
    
    # Get tier info - default to free tier if not found
    tier_info = SUBSCRIPTION_TIERS.get(price_id)
    if not tier_info:
        logger.warning(f"Unknown subscription tier: {price_id}, defaulting to free tier")
        tier_info = SUBSCRIPTION_TIERS[config.STRIPE_FREE_TIER_ID]
    
    # Calculate current month's usage
    current_usage = await calculate_monthly_usage(client, user_id)
    
    # Check if subscription limit is exceeded
    if current_usage >= tier_info['cost']:
        # Check if user has credits available
        credit_balance = await get_user_credit_balance(client, user_id)
        
        if credit_balance.balance_dollars >= CREDIT_MIN_START_DOLLARS:
            # User has enough credits cushion; they can continue
            return True, f"Subscription limit reached, using credits. Balance: {credit_balance.balance_credits} credits", subscription
        else:
            # Not enough credits to safely start a new request
            if credit_balance.can_purchase_credits:
                return False, (
                    f"Monthly limit of {int(tier_info['cost'] * 100)} credits reached. You need at least {int(CREDIT_MIN_START_DOLLARS * 100)} credits to continue. "
                    f"Current balance: {credit_balance.balance_credits} credits."
                ), subscription
            else:
                return False, (
                    f"Monthly limit of {int(tier_info['cost'] * 100)} credits reached and credits are unavailable. Please upgrade your plan or wait until next month."
                ), subscription
    
    return True, "OK", subscription

async def check_subscription_commitment(subscription_id: str) -> dict:
    """
    Check if a subscription has an active yearly commitment that prevents cancellation.
    Simple logic: commitment lasts 1 year from subscription creation date.
    """
    try:
        subscription = await stripe.Subscription.retrieve_async(subscription_id)
        
        # Get the price ID from subscription items
        price_id = None
        if subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
            price_id = subscription['items']['data'][0]['price']['id']
        
        # Check if subscription has commitment metadata OR uses a yearly commitment price ID
        # Since we no longer have yearly commitment plans, all subscriptions are cancelable
        return {
            'has_commitment': False,
            'can_cancel': True,
            'price_id': price_id
        }
        
    except Exception as e:
        logger.error(f"Error checking subscription commitment: {str(e)}", exc_info=True)
        return {
            'has_commitment': False,
            'can_cancel': True
        }

async def is_user_on_highest_tier(user_id: str) -> bool:
    """Check if user is on the highest subscription tier (Supremely Serious)."""
    try:
        subscription = await get_user_subscription(user_id)
        if not subscription:
            logger.debug(f"User {user_id} has no subscription")
            return False
        
        # Extract price ID from subscription
        price_id = None
        if subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
            price_id = subscription['items']['data'][0]['price']['id']
        
        logger.info(f"User {user_id} subscription price_id: {price_id}")
        
        # Check if it's the highest tier price ID (Supremely Serious only)
        highest_tier_price_ids = [
            config.STRIPE_TIER_SERIOUS_BUSINESS_ID,  # Monthly highest tier
            config.STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID,  # Yearly highest tier
        ]
        
        is_highest = price_id in highest_tier_price_ids
        logger.info(f"User {user_id} is_highest_tier: {is_highest}, price_id: {price_id}, checked against: {highest_tier_price_ids}")
        
        return is_highest
        
    except Exception as e:
        logger.error(f"Error checking if user is on highest tier: {str(e)}")
        return False

async def get_user_credit_balance(client: SupabaseClient, user_id: str) -> CreditBalance:
    """Get the credit balance for a user."""
    try:
        # Get balance from database - use execute() instead of single() to handle no records
        result = await client.table('credit_balance') \
            .select('*') \
            .eq('user_id', user_id) \
            .execute()
        
        if result.data and len(result.data) > 0:
            data = result.data[0]
            balance_dollars = float(data.get('balance_dollars', 0))
            return CreditBalance(
                balance_dollars=balance_dollars,
                balance_credits=int(balance_dollars * 100),  # Convert to credits
                total_purchased=float(data.get('total_purchased', 0)),
                total_used=float(data.get('total_used', 0)),
                last_updated=data.get('last_updated'),
                can_purchase_credits=True
            )
        else:
            # No balance record exists yet - this is normal for users who haven't purchased credits
            return CreditBalance(
                balance_dollars=0.0,
                balance_credits=0,
                total_purchased=0.0,
                total_used=0.0,
                can_purchase_credits=True
            )
    except Exception as e:
        logger.error(f"Error getting credit balance for user {user_id}: {str(e)}")
        return CreditBalance(
            balance_dollars=0.0,
            balance_credits=0,
            total_purchased=0.0,
            total_used=0.0,
            can_purchase_credits=True
        )

async def add_credits_to_balance(client: SupabaseClient, user_id: str, amount: float, purchase_id: str = None) -> float:
    """Add credits to a user's balance."""
    try:
        # Use the database function to add credits
        result = await client.rpc('add_credits', {
            'p_user_id': user_id,
            'p_amount': amount,
            'p_purchase_id': purchase_id
        }).execute()
        
        if result.data is not None:
            return float(result.data)
        return 0.0
    except Exception as e:
        logger.error(f"Error adding credits for user {user_id}: {str(e)}")
        raise

async def use_credits_from_balance(
    client: SupabaseClient, 
    user_id: str, 
    amount: float, 
    description: str = None,
    thread_id: str = None,
    message_id: str = None
) -> bool:
    """Deduct credits from a user's balance."""
    try:
        # Use the database function to use credits
        result = await client.rpc('use_credits', {
            'p_user_id': user_id,
            'p_amount': amount,
            'p_description': description,
            'p_thread_id': thread_id,
            'p_message_id': message_id
        }).execute()
        
        if result.data is not None:
            return bool(result.data)
        return False
    except Exception as e:
        logger.error(f"Error using credits for user {user_id}: {str(e)}")
        return False

async def handle_usage_with_credits(
    client: SupabaseClient,
    user_id: str,
    token_cost: float,
    thread_id: str = None,
    message_id: str = None,
    model: str = None
) -> Tuple[bool, str]:
    """
    Handle token usage that may require credits if subscription limit is exceeded.
    This should be called after each agent response to track and deduct from credits if needed.
    
    Returns:
        Tuple[bool, str]: (success, message)
    """
    try:
        # Get current subscription tier and limits
        subscription = await get_user_subscription(user_id)
        
        # Get tier info
        price_id = config.STRIPE_FREE_TIER_ID  # Default to free
        if subscription and subscription.get('items'):
            items = subscription['items'].get('data', [])
            if items:
                price_id = items[0]['price']['id']
        
        tier_info = SUBSCRIPTION_TIERS.get(price_id, SUBSCRIPTION_TIERS[config.STRIPE_FREE_TIER_ID])
        
        # Get current month's usage
        current_usage = await calculate_monthly_usage(client, user_id)
        
        # Check if this usage would exceed the subscription limit
        new_total_usage = current_usage + token_cost
        
        if new_total_usage > tier_info['cost']:
            # Calculate overage amount
            overage_amount = token_cost  # The entire cost if already over limit
            if current_usage < tier_info['cost']:
                # If this is the transaction that pushes over the limit
                overage_amount = new_total_usage - tier_info['cost']
            
            # Try to use credits for the overage
            credit_balance = await get_user_credit_balance(client, user_id)
            
            if credit_balance.balance_dollars >= overage_amount:
                # Deduct from credits
                success = await use_credits_from_balance(
                    client,
                    user_id,
                    overage_amount,
                    description=f"Token overage for model {model or 'unknown'}",
                    thread_id=thread_id,
                    message_id=message_id
                )
                
                if success:
                    logger.debug(f"Used {int(overage_amount * 100)} credits for user {user_id} overage")
                    return True, f"Used {int(overage_amount * 100)} credits from balance (Balance: {credit_balance.balance_credits - int(overage_amount * 100)} credits)"
                else:
                    return False, "Failed to deduct credits"
            else:
                # Insufficient credits
                if credit_balance.can_purchase_credits:
                    return False, f"Insufficient credits. Balance: {credit_balance.balance_credits} credits, Required: {int(overage_amount * 100)} credits. Purchase more credits to continue."
                else:
                    return False, f"Monthly limit exceeded and no credits available. Upgrade to the highest tier to purchase credits."
        
        # Within subscription limits, no credits needed
        return True, "Within subscription limits"
        
    except Exception as e:
        logger.error(f"Error handling usage with credits: {str(e)}")
        return False, f"Error processing usage: {str(e)}"

# API endpoints
@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Create a Stripe Checkout session or modify an existing subscription."""
    try:
        # Get Supabase client
        db = DBConnection()
        client = await db.client
        
        # Get user email from auth.users
        user_result = await client.auth.admin.get_user_by_id(current_user_id)
        if not user_result: raise HTTPException(status_code=404, detail="User not found")
        email = user_result.user.email
        
        # Get or create Stripe customer
        customer_id = await get_stripe_customer_id(client, current_user_id)
        if not customer_id: customer_id = await create_stripe_customer(client, current_user_id, email)
        
        # Get the target price and product ID
        try:
            price = await stripe.Price.retrieve_async(request.price_id, expand=['product'])
            product_id = price['product']['id']
        except stripe.error.InvalidRequestError:
            raise HTTPException(status_code=400, detail=f"Invalid price ID: {request.price_id}")
            
        # Verify the price belongs to our subscription product or credits product
        # Allow both subscription and credits products
        valid_product_ids = [
            config.STRIPE_SUBSCRIPTION_PRODUCT_ID, 
            config.STRIPE_CREDITS_PRODUCT_ID,
            config.STRIPE_PRODUCT_ID  # Legacy support
        ]
        
        if product_id not in valid_product_ids:
            logger.error(f"Price {request.price_id} belongs to product {product_id}, but expected one of: {valid_product_ids}")
            raise HTTPException(status_code=400, detail="Price ID does not belong to the correct product.")
            
        # Check for existing subscription for our product
        existing_subscription = await get_user_subscription(current_user_id)
        # print("Existing subscription for product:", existing_subscription)
        
        if existing_subscription:
            # --- Handle Subscription Change (Upgrade or Downgrade) ---
            try:
                subscription_id = existing_subscription['id']
                subscription_item = existing_subscription['items']['data'][0]
                current_price_id = subscription_item['price']['id']
                
                # Skip if already on this plan
                if current_price_id == request.price_id:
                    return {
                        "subscription_id": subscription_id,
                        "status": "no_change",
                        "message": "Already subscribed to this plan.",
                        "details": {
                            "is_upgrade": None,
                            "effective_date": None,
                            "current_price": round(price['unit_amount'] / 100, 2) if price.get('unit_amount') else 0,
                            "new_price": round(price['unit_amount'] / 100, 2) if price.get('unit_amount') else 0,
                        }
                    }
                
                # Validate plan change restrictions
                is_allowed, restriction_reason = is_plan_change_allowed(current_price_id, request.price_id)
                if not is_allowed:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Plan change not allowed: {restriction_reason}"
                    )
                
                # Check current subscription's commitment status
                commitment_info = await check_subscription_commitment(subscription_id)
                
                # Get current and new price details
                current_price = await stripe.Price.retrieve_async(current_price_id)
                new_price = price # Already retrieved
                
                # Determine if this is an upgrade
                # Consider yearly plans as upgrades regardless of unit price (due to discounts)
                current_interval = current_price.get('recurring', {}).get('interval', 'month')
                new_interval = new_price.get('recurring', {}).get('interval', 'month')
                
                is_upgrade = (
                    new_price['unit_amount'] > current_price['unit_amount'] or  # Traditional price upgrade
                    (current_interval == 'month' and new_interval == 'year')    # Monthly to yearly upgrade
                )
                
                logger.debug(f"Price comparison: current={current_price['unit_amount']}, new={new_price['unit_amount']}, "
                           f"intervals: {current_interval}->{new_interval}, is_upgrade={is_upgrade}")

                # For commitment subscriptions, handle differently
                if commitment_info.get('has_commitment'):
                    if is_upgrade:
                        # Allow upgrades for commitment subscriptions immediately
                        logger.debug(f"Upgrading commitment subscription {subscription_id}")
                        
                        # Regular subscription modification for upgrades
                        updated_subscription = await stripe.Subscription.modify_async(
                            subscription_id,
                            items=[{
                                'id': subscription_item['id'],
                                'price': request.price_id,
                            }],
                            proration_behavior='always_invoice',  # Prorate and charge immediately
                            billing_cycle_anchor='now',          # Reset billing cycle
                            metadata={
                                **existing_subscription.get('metadata', {}),
                                'commitment_type': request.commitment_type or 'monthly'
                            }
                        )
                        
                        # Update active status in database
                        await client.schema('basejump').from_('billing_customers').update(
                            {'active': True}
                        ).eq('id', customer_id).execute()
                        logger.debug(f"Updated customer {customer_id} active status to TRUE after subscription upgrade")
                        
                        # Force immediate payment for upgrades
                        latest_invoice = None
                        if updated_subscription.latest_invoice:
                            latest_invoice_id = updated_subscription.latest_invoice
                            latest_invoice = await stripe.Invoice.retrieve_async(latest_invoice_id)
                            
                            try:
                                logger.debug(f"Latest invoice {latest_invoice_id} status: {latest_invoice.status}")
                                
                                # If invoice is in draft status, finalize it to trigger immediate payment
                                if latest_invoice.status == 'draft':
                                    finalized_invoice = stripe.Invoice.finalize_invoice(latest_invoice_id)
                                    logger.debug(f"Finalized invoice {latest_invoice_id} for immediate payment")
                                    latest_invoice = finalized_invoice
                                    
                                    # Pay the invoice immediately if it's still open
                                    if finalized_invoice.status == 'open':
                                        paid_invoice = stripe.Invoice.pay(latest_invoice_id)
                                        logger.debug(f"Paid invoice {latest_invoice_id} immediately, status: {paid_invoice.status}")
                                        latest_invoice = paid_invoice
                                elif latest_invoice.status == 'open':
                                    # Invoice is already finalized but not paid, pay it
                                    paid_invoice = stripe.Invoice.pay(latest_invoice_id)
                                    logger.debug(f"Paid existing open invoice {latest_invoice_id}, status: {paid_invoice.status}")
                                    latest_invoice = paid_invoice
                                else:
                                    logger.debug(f"Invoice {latest_invoice_id} is in status {latest_invoice.status}, no action needed")
                                    
                            except Exception as invoice_error:
                                logger.error(f"Error processing invoice for immediate payment: {str(invoice_error)}")
                                # Don't fail the entire operation if invoice processing fails
                        
                        return {
                            "subscription_id": updated_subscription.id,
                            "status": "updated",
                            "message": f"Subscription upgraded successfully",
                            "details": {
                                "is_upgrade": True,
                                "effective_date": "immediate",
                                "current_price": round(current_price['unit_amount'] / 100, 2) if current_price.get('unit_amount') else 0,
                                "new_price": round(new_price['unit_amount'] / 100, 2) if new_price.get('unit_amount') else 0,
                                "invoice": {
                                    "id": latest_invoice['id'] if latest_invoice else None,
                                    "status": latest_invoice['status'] if latest_invoice else None,
                                    "amount_due": round(latest_invoice['amount_due'] / 100, 2) if latest_invoice else 0,
                                    "amount_paid": round(latest_invoice['amount_paid'] / 100, 2) if latest_invoice else 0
                                } if latest_invoice else None
                            }
                        }
                    else:
                        # Downgrade for commitment subscription - must wait until commitment ends
                        if not commitment_info.get('can_cancel'):
                            return {
                                "subscription_id": subscription_id,
                                "status": "commitment_blocks_downgrade",
                                "message": f"Cannot downgrade during commitment period. {commitment_info.get('months_remaining', 0)} months remaining.",
                                "details": {
                                    "is_upgrade": False,
                                    "effective_date": commitment_info.get('commitment_end_date'),
                                    "current_price": round(current_price['unit_amount'] / 100, 2) if current_price.get('unit_amount') else 0,
                                    "new_price": round(new_price['unit_amount'] / 100, 2) if new_price.get('unit_amount') else 0,
                                    "commitment_end_date": commitment_info.get('commitment_end_date'),
                                    "months_remaining": commitment_info.get('months_remaining', 0)
                                }
                            }
                        # If commitment allows cancellation, proceed with normal downgrade logic
                else:
                    # Regular subscription without commitment - use existing logic
                    pass

                if is_upgrade:
                    # --- Handle Upgrade --- Immediate modification
                    updated_subscription = await stripe.Subscription.modify_async(
                        subscription_id,
                        items=[{
                            'id': subscription_item['id'],
                            'price': request.price_id,
                        }],
                        proration_behavior='always_invoice', # Prorate and charge immediately
                        billing_cycle_anchor='now' # Reset billing cycle
                    )
                    
                    # Customer has active subscription (no database update needed)
                    logger.debug(f"Customer {customer_id} has active subscription after upgrade")
                    
                    latest_invoice = None
                    if updated_subscription.latest_invoice:
                        latest_invoice_id = updated_subscription.latest_invoice
                        latest_invoice = await stripe.Invoice.retrieve_async(latest_invoice_id)
                        
                        # Force immediate payment for upgrades
                        try:
                            logger.debug(f"Latest invoice {latest_invoice_id} status: {latest_invoice.status}")
                            
                            # If invoice is in draft status, finalize it to trigger immediate payment
                            if latest_invoice.status == 'draft':
                                finalized_invoice = stripe.Invoice.finalize_invoice(latest_invoice_id)
                                logger.debug(f"Finalized invoice {latest_invoice_id} for immediate payment")
                                latest_invoice = finalized_invoice  # Update reference
                                
                                # Pay the invoice immediately if it's still open
                                if finalized_invoice.status == 'open':
                                    paid_invoice = stripe.Invoice.pay(latest_invoice_id)
                                    logger.debug(f"Paid invoice {latest_invoice_id} immediately, status: {paid_invoice.status}")
                                    latest_invoice = paid_invoice  # Update reference
                            elif latest_invoice.status == 'open':
                                # Invoice is already finalized but not paid, pay it
                                paid_invoice = stripe.Invoice.pay(latest_invoice_id)
                                logger.debug(f"Paid existing open invoice {latest_invoice_id}, status: {paid_invoice.status}")
                                latest_invoice = paid_invoice  # Update reference
                            else:
                                logger.debug(f"Invoice {latest_invoice_id} is in status {latest_invoice.status}, no action needed")
                                
                        except Exception as invoice_error:
                            logger.error(f"Error processing invoice for immediate payment: {str(invoice_error)}")
                            # Don't fail the entire operation if invoice processing fails
                        
                    return {
                        "subscription_id": updated_subscription.id,
                        "status": "updated",
                        "message": "Subscription upgraded successfully",
                        "details": {
                            "is_upgrade": True,
                            "effective_date": "immediate",
                            "current_price": round(current_price['unit_amount'] / 100, 2) if current_price.get('unit_amount') else 0,
                            "new_price": round(new_price['unit_amount'] / 100, 2) if new_price.get('unit_amount') else 0,
                            "invoice": {
                                "id": latest_invoice['id'] if latest_invoice else None,
                                "status": latest_invoice['status'] if latest_invoice else None,
                                "amount_due": round(latest_invoice['amount_due'] / 100, 2) if latest_invoice else 0,
                                "amount_paid": round(latest_invoice['amount_paid'] / 100, 2) if latest_invoice else 0
                            } if latest_invoice else None
                        }
                    }
                else:
                    # --- Handle Downgrade --- Simple downgrade at period end
                    updated_subscription = await stripe.Subscription.modify_async(
                        subscription_id,
                        items=[{
                            'id': subscription_item['id'],
                            'price': request.price_id,
                        }],
                        proration_behavior='none',  # No proration for downgrades
                        billing_cycle_anchor='unchanged'  # Keep current billing cycle
                    )
                    
                    # Customer has active subscription (no database update needed)
                    logger.debug(f"Customer {customer_id} has active subscription after downgrade")
                    
                    return {
                        "subscription_id": updated_subscription.id,
                        "status": "updated",
                        "message": "Subscription downgraded successfully",
                        "details": {
                            "is_upgrade": False,
                            "effective_date": "immediate",
                            "current_price": round(current_price['unit_amount'] / 100, 2) if current_price.get('unit_amount') else 0,
                            "new_price": round(new_price['unit_amount'] / 100, 2) if new_price.get('unit_amount') else 0,
                        }
                    }
            except Exception as e:
                logger.exception(f"Error updating subscription {existing_subscription.get('id') if existing_subscription else 'N/A'}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error updating subscription: {str(e)}")
        else:
            # Create regular subscription with commitment metadata if specified
            session = await stripe.checkout.Session.create_async(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{'price': request.price_id, 'quantity': 1}],
                mode='subscription',
                subscription_data={
                    'metadata': {
                        'commitment_type': request.commitment_type or 'monthly',
                        'user_id': current_user_id
                    }
                },
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                metadata={
                    'user_id': current_user_id,
                    'product_id': product_id,
                    'tolt_referral': request.tolt_referral,
                    'commitment_type': request.commitment_type or 'monthly'
                },
                allow_promotion_codes=True
            )
            
            # Customer status will be confirmed by webhook
            logger.debug(f"Created checkout session for customer {customer_id}")
            
            return {"session_id": session['id'], "url": session['url'], "status": "new"}
        
    except Exception as e:
        logger.exception(f"Error creating checkout session: {str(e)}")
        # Check if it's a Stripe error with more details
        if hasattr(e, 'json_body') and e.json_body and 'error' in e.json_body:
            error_detail = e.json_body['error'].get('message', str(e))
        else:
            error_detail = str(e)
        raise HTTPException(status_code=500, detail=f"Error creating checkout session: {error_detail}")

@router.post("/create-portal-session")
async def create_portal_session(
    request: CreatePortalSessionRequest,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Create a Stripe Customer Portal session for subscription management."""
    try:
        # Get Supabase client
        db = DBConnection()
        client = await db.client
        
        # Get customer ID
        customer_id = await get_stripe_customer_id(client, current_user_id)
        if not customer_id:
            raise HTTPException(status_code=404, detail="No billing customer found")
        
        # Ensure the portal configuration has subscription_update enabled
        try:
            # First, check if we have a configuration that already enables subscription update
            configurations = await stripe.billing_portal.Configuration.list_async(limit=100)
            active_config = None
            
            # Look for a configuration with subscription_update enabled
            for config in configurations.get('data', []):
                features = config.get('features', {})
                subscription_update = features.get('subscription_update', {})
                if subscription_update.get('enabled', False):
                    active_config = config
                    logger.debug(f"Found existing portal configuration with subscription_update enabled: {config['id']}")
                    break
            
            # If no config with subscription_update found, create one or update the active one
            if not active_config:
                # Find the active configuration or create a new one
                if configurations.get('data', []):
                    default_config = configurations['data'][0]
                    logger.debug(f"Updating default portal configuration: {default_config['id']} to enable subscription_update")
                    
                    active_config = await stripe.billing_portal.Configuration.update_async(
                        default_config['id'],
                        features={
                            'subscription_update': {
                                'enabled': True,
                                'proration_behavior': 'create_prorations',
                                'default_allowed_updates': ['price']
                            },
                            # Preserve other features that may already be enabled
                            'customer_update': default_config.get('features', {}).get('customer_update', {'enabled': True, 'allowed_updates': ['email', 'address']}),
                            'invoice_history': {'enabled': True},
                            'payment_method_update': {'enabled': True}
                        }
                    )
                else:
                    # Create a new configuration with subscription_update enabled
                    logger.debug("Creating new portal configuration with subscription_update enabled")
                    active_config = await stripe.billing_portal.Configuration.create_async(
                        business_profile={
                            'headline': 'Subscription Management',
                            'privacy_policy_url': config.FRONTEND_URL + '/privacy',
                            'terms_of_service_url': config.FRONTEND_URL + '/terms'
                        },
                        features={
                            'subscription_update': {
                                'enabled': True,
                                'proration_behavior': 'create_prorations',
                                'default_allowed_updates': ['price']
                            },
                            'customer_update': {
                                'enabled': True,
                                'allowed_updates': ['email', 'address']
                            },
                            'invoice_history': {'enabled': True},
                            'payment_method_update': {'enabled': True}
                        }
                    )
            
            # Log the active configuration for debugging
            logger.debug(f"Using portal configuration: {active_config['id']} with subscription_update: {active_config.get('features', {}).get('subscription_update', {}).get('enabled', False)}")
        
        except Exception as config_error:
            logger.warning(f"Error configuring portal: {config_error}. Continuing with default configuration.")
        
        # Create portal session using the proper configuration if available
        portal_params = {
            "customer": customer_id,
            "return_url": request.return_url
        }
        
        # Add configuration_id if we found or created one with subscription_update enabled
        if active_config:
            portal_params["configuration"] = active_config['id']
        
        # Create the session
        session = await stripe.billing_portal.Session.create_async(**portal_params)
        
        return {"url": session.url}
        
    except Exception as e:
        logger.error(f"Error creating portal session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subscription")
async def get_subscription(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the current subscription status for the current user, including scheduled changes and credit balance."""
    try:
        # Get subscription from Stripe (this helper already handles filtering/cleanup)
        subscription = await get_user_subscription(current_user_id)
        # print("Subscription data for status:", subscription)
        
        # Calculate current usage
        db = DBConnection()
        client = await db.client
        current_usage = await calculate_monthly_usage(client, current_user_id)
        
        # Get credit balance
        credit_balance_info = await get_user_credit_balance(client, current_user_id)

        if not subscription:
            # Default to free tier status if no active subscription for our product
            free_tier_id = config.STRIPE_FREE_TIER_ID
            free_tier_info = SUBSCRIPTION_TIERS.get(free_tier_id)
            return SubscriptionStatus(
                status="no_subscription",
                plan_name=free_tier_info.get('name', 'free') if free_tier_info else 'free',
                price_id=free_tier_id,
                minutes_limit=free_tier_info.get('minutes') if free_tier_info else 0,
                cost_limit=free_tier_info.get('cost') if free_tier_info else 0,
                current_usage=current_usage,
                credit_balance=credit_balance_info.balance_dollars,
                credit_balance_credits=credit_balance_info.balance_credits,
                credit_total_purchased=credit_balance_info.total_purchased,
                credit_total_used=credit_balance_info.total_used,
                can_purchase_credits=True
            )
        
        # Extract current plan details
        current_item = subscription['items']['data'][0]
        current_price_id = current_item['price']['id']
        current_tier_info = SUBSCRIPTION_TIERS.get(current_price_id)
        if not current_tier_info:
            # Fallback if somehow subscribed to an unknown price within our product
            logger.warning(f"User {current_user_id} subscribed to unknown price {current_price_id}. Defaulting info.")
            current_tier_info = {'name': 'unknown', 'minutes': 0}
        
        status_response = SubscriptionStatus(
            status=subscription['status'], # 'active', 'trialing', etc.
            plan_name=subscription['plan'].get('nickname') or current_tier_info['name'],
            price_id=current_price_id,
            current_period_end=datetime.fromtimestamp(current_item['current_period_end'], tz=timezone.utc),
            cancel_at_period_end=subscription['cancel_at_period_end'],
            trial_end=datetime.fromtimestamp(subscription.get('trial_end'), tz=timezone.utc) if subscription.get('trial_end') else None,
            minutes_limit=current_tier_info['minutes'],
            cost_limit=current_tier_info['cost'],
            current_usage=current_usage,
            has_schedule=False, # Default
            subscription_id=subscription['id'],
            subscription={
                'id': subscription['id'],
                'status': subscription['status'],
                'cancel_at_period_end': subscription['cancel_at_period_end'],
                'cancel_at': subscription.get('cancel_at'),
                'current_period_end': current_item['current_period_end']
            },
            credit_balance=credit_balance_info.balance_dollars,
            credit_balance_credits=credit_balance_info.balance_credits,
            credit_total_purchased=credit_balance_info.total_purchased,
            credit_total_used=credit_balance_info.total_used,
            can_purchase_credits=True
        )

        # Check for an attached schedule (indicates pending downgrade)
        schedule_id = subscription.get('schedule')
        if schedule_id:
            try:
                schedule = await stripe.SubscriptionSchedule.retrieve_async(schedule_id)
                # Find the *next* phase after the current one
                next_phase = None
                current_phase_end = current_item['current_period_end']
                
                for phase in schedule.get('phases', []):
                    # Check if this phase starts exactly when the current one ends
                    if phase.get('start_date') == current_phase_end:
                        next_phase = phase
                        break # Found the immediate next phase

                if next_phase:
                    scheduled_item = next_phase['items'][0] # Assuming single item
                    scheduled_price_id = scheduled_item['price'] # Price ID might be string here
                    scheduled_tier_info = SUBSCRIPTION_TIERS.get(scheduled_price_id)
                    
                    status_response.has_schedule = True
                    status_response.status = 'scheduled_downgrade' # Override status
                    status_response.scheduled_plan_name = scheduled_tier_info.get('name', 'unknown') if scheduled_tier_info else 'unknown'
                    status_response.scheduled_price_id = scheduled_price_id
                    status_response.scheduled_change_date = datetime.fromtimestamp(next_phase['start_date'], tz=timezone.utc)
                    
            except Exception as schedule_error:
                logger.error(f"Error retrieving or parsing schedule {schedule_id} for sub {subscription['id']}: {schedule_error}")
                # Proceed without schedule info if retrieval fails

        return status_response
        
    except Exception as e:
        logger.exception(f"Error getting subscription status for user {current_user_id}: {str(e)}") # Use logger.exception
        raise HTTPException(status_code=500, detail="Error retrieving subscription status.")

@router.get("/check-status")
async def check_status(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Check if the user can run agents based on their subscription, usage, and credit balance."""
    try:
        # Get Supabase client
        db = DBConnection()
        client = await db.client
        
        can_run, message, subscription = await check_billing_status(client, current_user_id)
        
        # Get credit balance for additional info
        credit_balance = await get_user_credit_balance(client, current_user_id)
        
        return {
            "can_run": can_run,
            "message": message,
            "subscription": subscription,
            "credit_balance": credit_balance.balance_dollars,
            "can_purchase_credits": credit_balance.can_purchase_credits
        }
        
    except Exception as e:
        logger.error(f"Error checking billing status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    try:
        # Get the webhook secret from config
        webhook_secret = config.STRIPE_WEBHOOK_SECRET
        
        # Get the webhook payload
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            logger.debug(f"Received Stripe webhook: {event.type} - Event ID: {event.id}")
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Get database connection
        db = DBConnection()
        client = await db.client
        
        # Handle credit purchase completion
        if event.type == 'checkout.session.completed':
            session = event.data.object
            
            # Check if this is a credit purchase
            if session.get('metadata', {}).get('type') == 'credit_purchase':
                user_id = session['metadata']['user_id']
                credit_amount = float(session['metadata']['credit_amount'])
                payment_intent_id = session.get('payment_intent')
                
                logger.debug(f"Processing credit purchase for user {user_id}: ${credit_amount}")
                
                try:
                    # Update the purchase record status
                    purchase_update = await client.table('credit_purchases') \
                        .update({
                            'status': 'completed',
                            'completed_at': datetime.now(timezone.utc).isoformat(),
                            'stripe_payment_intent_id': payment_intent_id
                        }) \
                        .eq('stripe_payment_intent_id', payment_intent_id) \
                        .execute()
                    
                    if not purchase_update.data:
                        # If no record found by payment_intent_id, try by session_id in metadata (PostgREST JSON operator requires filter)
                        purchase_update = await client.table('credit_purchases') \
                            .update({
                                'status': 'completed',
                                'completed_at': datetime.now(timezone.utc).isoformat(),
                                'stripe_payment_intent_id': payment_intent_id
                            }) \
                            .filter('metadata->>session_id', 'eq', session['id']) \
                            .execute()
                    
                    # Add credits to user's balance
                    purchase_id = purchase_update.data[0]['id'] if purchase_update.data else None
                    new_balance = await add_credits_to_balance(client, user_id, credit_amount, purchase_id)
                    
                    logger.info(f"Successfully added ${credit_amount} credits to user {user_id}. New balance: ${new_balance}")
                    
                    # Clear cache for this user
                    await Cache.delete(f"monthly_usage:{user_id}")
                    await Cache.delete(f"user_subscription:{user_id}")
                    
                except Exception as e:
                    logger.error(f"Error processing credit purchase: {str(e)}")
                    # Don't fail the webhook, but log the error
                
                return {"status": "success", "message": "Credit purchase processed"}
        
        # Handle payment failed for credit purchases
        if event.type == 'payment_intent.payment_failed':
            payment_intent = event.data.object
            
            # Check if this is related to a credit purchase
            if payment_intent.get('metadata', {}).get('type') == 'credit_purchase':
                user_id = payment_intent['metadata']['user_id']
                
                # Update purchase record to failed
                await client.table('credit_purchases') \
                    .update({'status': 'failed'}) \
                    .eq('stripe_payment_intent_id', payment_intent['id']) \
                    .execute()
                
                logger.debug(f"Credit purchase failed for user {user_id}")
        
        # Handle the existing subscription events
        if event.type in ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted']:
            # Extract the subscription and customer information
            subscription = event.data.object
            customer_id = subscription.get('customer')
            
            if not customer_id:
                logger.warning(f"No customer ID found in subscription event: {event.type}")
                return {"status": "error", "message": "No customer ID found"}
            
            if event.type == 'customer.subscription.created':
                # Log subscription creation
                if subscription.get('status') in ['active', 'trialing']:
                    logger.debug(f"Webhook: Customer {customer_id} subscription created and active based on {event.type}")
                    
            elif event.type == 'customer.subscription.updated':
                # Log subscription update
                if subscription.get('status') in ['active', 'trialing']:
                    logger.debug(f"Webhook: Customer {customer_id} subscription updated and active based on {event.type}")
                else:
                    logger.debug(f"Webhook: Customer {customer_id} subscription updated to {subscription.get('status')} based on {event.type}")
            
            elif event.type == 'customer.subscription.deleted':
                # Log subscription deletion
                logger.debug(f"Webhook: Customer {customer_id} subscription deleted based on {event.type}")
            
            logger.debug(f"Processed {event.type} event for customer {customer_id}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available-models")
async def get_available_models(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the list of models available to the user based on their subscription tier."""
    try:
        # Get Supabase client
        db = DBConnection()
        client = await db.client
        
        # Check if we're in local development mode
        if config.ENV_MODE == EnvMode.LOCAL:
            logger.debug("Running in local development mode - billing checks are disabled")
            
            # In local mode, return all models from MODEL_NAME_ALIASES
            model_info = []
            for short_name, full_name in MODEL_NAME_ALIASES.items():
                # Skip entries where the key is a full name to avoid duplicates
                # if short_name == full_name or '/' in short_name:
                #     continue
                
                model_info.append({
                    "id": full_name,
                    "display_name": short_name,
                    "short_name": short_name,
                    "requires_subscription": False  # Always false in local dev mode
                })
            
            return {
                "models": model_info,
                "subscription_tier": "Local Development",
                "total_models": len(model_info)
            }
        
        
        # For non-local mode, get list of allowed models for this user
        allowed_models = await get_allowed_models_for_user(client, current_user_id)
        free_tier_models = MODEL_ACCESS_TIERS.get('free', [])
        
        # Get subscription info for context
        subscription = await get_user_subscription(current_user_id)
        
        # Determine tier name from subscription
        tier_name = 'free'
        if subscription:
            price_id = None
            if subscription.get('items') and subscription['items'].get('data') and len(subscription['items']['data']) > 0:
                price_id = subscription['items']['data'][0]['price']['id']
            else:
                price_id = subscription.get('price_id', config.STRIPE_FREE_TIER_ID)
            
            # Get tier info for this price_id
            tier_info = SUBSCRIPTION_TIERS.get(price_id)
            if tier_info:
                tier_name = tier_info['name']
        
        # Get all unique full model names from MODEL_NAME_ALIASES
        all_models = set()
        model_aliases = {}
        
        for short_name, full_name in MODEL_NAME_ALIASES.items():
            # Add all unique full model names
            all_models.add(full_name)
            
            # Only include short names that don't match their full names for aliases
            if short_name != full_name and not short_name.startswith("openai/") and not short_name.startswith("anthropic/") and not short_name.startswith("openrouter/") and not short_name.startswith("xai/"):
                if full_name not in model_aliases:
                    model_aliases[full_name] = short_name
        
        # Create model info with display names for ALL models
        model_info = []
        for model in all_models:
            display_name = model_aliases.get(model, model.split('/')[-1] if '/' in model else model)
            
            # Check if model requires subscription (not in free tier)
            requires_sub = model not in free_tier_models
            
            # Check if model is available with current subscription
            is_available = model in allowed_models
            
            # Get pricing information - check hardcoded prices first, then litellm
            pricing_info = {}
            
            # Check if we have hardcoded pricing for this model
            hardcoded_pricing = get_model_pricing(model)
            if hardcoded_pricing:
                input_cost_per_million, output_cost_per_million = hardcoded_pricing
                pricing_info = {
                    "input_cost_per_million_tokens": input_cost_per_million * TOKEN_PRICE_MULTIPLIER,
                    "output_cost_per_million_tokens": output_cost_per_million * TOKEN_PRICE_MULTIPLIER,
                    "max_tokens": None
                }
            else:
                try:
                    # Try to get pricing using cost_per_token function
                    models_to_try = []
                    
                    # Add the original model name
                    models_to_try.append(model)
                    
                    # Try to resolve the model name using MODEL_NAME_ALIASES
                    if model in MODEL_NAME_ALIASES:
                        resolved_model = MODEL_NAME_ALIASES[model]
                        models_to_try.append(resolved_model)
                        # Also try without provider prefix if it has one
                        if '/' in resolved_model:
                            models_to_try.append(resolved_model.split('/', 1)[1])
                    
                    # If model is a value in aliases, try to find a matching key
                    for alias_key, alias_value in MODEL_NAME_ALIASES.items():
                        if alias_value == model:
                            models_to_try.append(alias_key)
                            break
                    
                    # Also try without provider prefix for the original model
                    if '/' in model:
                        models_to_try.append(model.split('/', 1)[1])
                    
                    # Special handling for Google models accessed via Google API
                    if model.startswith('gemini/'):
                        google_model_name = model.replace('gemini/', '')
                        models_to_try.append(google_model_name)
                    
                    # Vertex AI handling removed
                    
                    # Try each model name variation until we find one that works
                    input_cost_per_token = None
                    output_cost_per_token = None
                    
                    for model_name in models_to_try:
                        try:
                            # Use cost_per_token with sample token counts to get the per-token costs
                            input_cost, output_cost = cost_per_token(model_name, 1000000, 1000000)
                            if input_cost is not None and output_cost is not None:
                                input_cost_per_token = input_cost
                                output_cost_per_million = output_cost
                                break
                        except Exception:
                            continue
                    
                    if input_cost_per_token is not None and output_cost_per_million is not None:
                        pricing_info = {
                            "input_cost_per_million_tokens": input_cost_per_token * TOKEN_PRICE_MULTIPLIER,
                            "output_cost_per_million_tokens": output_cost_per_million * TOKEN_PRICE_MULTIPLIER,
                            "max_tokens": None  # cost_per_token doesn't provide max_tokens info
                        }
                    else:
                        pricing_info = {
                            "input_cost_per_million_tokens": None,
                            "output_cost_per_million_tokens": None,
                            "max_tokens": None
                        }
                except Exception as e:
                    logger.warning(f"Could not get pricing for model {model}: {str(e)}")
                    pricing_info = {
                        "input_cost_per_million_tokens": None,
                        "output_cost_per_million_tokens": None,
                        "max_tokens": None
                    }

            model_info.append({
                "id": model,
                "display_name": display_name,
                "short_name": model_aliases.get(model),
                "requires_subscription": requires_sub,
                "is_available": is_available,
                **pricing_info
            })
        
        return {
            "models": model_info,
            "subscription_tier": tier_name,
            "total_models": len(model_info)
        }
        
    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting available models: {str(e)}")


@router.get("/usage-logs")
async def get_usage_logs_endpoint(
    page: int = 0,
    items_per_page: int = 1000,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get detailed usage logs for a user with pagination."""
    try:
        # Get Supabase client
        db = DBConnection()
        client = await db.client
        
        # Check if we're in local development mode
        if config.ENV_MODE == EnvMode.LOCAL:
            logger.debug("Running in local development mode - usage logs are not available")
            return {
                "logs": [], 
                "has_more": False,
                "message": "Usage logs are not available in local development mode"
            }
        
        # Validate pagination parameters
        if page < 0:
            raise HTTPException(status_code=400, detail="Page must be non-negative")
        if items_per_page < 1 or items_per_page > 1000:
            raise HTTPException(status_code=400, detail="Items per page must be between 1 and 1000")
        
        # Get usage logs
        result = await get_usage_logs(client, current_user_id, page, items_per_page)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting usage logs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting usage logs: {str(e)}")

@router.get("/subscription-commitment/{subscription_id}")
async def get_subscription_commitment(
    subscription_id: str,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get commitment status for a subscription."""
    try:
        # Verify the subscription belongs to the current user
        db = DBConnection()
        client = await db.client
        
        # Get user's subscription to verify ownership
        user_subscription = await get_user_subscription(current_user_id)
        if not user_subscription or user_subscription.get('id') != subscription_id:
            raise HTTPException(status_code=404, detail="Subscription not found or access denied")
        
        commitment_info = await check_subscription_commitment(subscription_id)
        return commitment_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription commitment: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving commitment information")

@router.get("/subscription-details")
async def get_subscription_details(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get detailed subscription information including commitment status."""
    try:
        subscription = await get_user_subscription(current_user_id)
        if not subscription:
            return {
                "subscription": None,
                "commitment": {"has_commitment": False, "can_cancel": True}
            }
        
        # Get commitment information
        commitment_info = await check_subscription_commitment(subscription['id'])
        
        # Enhanced subscription details
        subscription_details = {
            "id": subscription.get('id'),
            "status": subscription.get('status'),
            "current_period_end": subscription.get('current_period_end'),
            "current_period_start": subscription.get('current_period_start'),
            "cancel_at_period_end": subscription.get('cancel_at_period_end'),
            "items": subscription.get('items', {}).get('data', []),
            "metadata": subscription.get('metadata', {})
        }
        
        return {
            "subscription": subscription_details,
            "commitment": commitment_info
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription details: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving subscription details")

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Cancel subscription with yearly commitment handling."""
    try:
        # Get user's current subscription
        subscription = await get_user_subscription(current_user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        subscription_id = subscription['id']
        
        # Check commitment status
        commitment_info = await check_subscription_commitment(subscription_id)
        
        # If subscription has yearly commitment and still in commitment period
        if commitment_info.get('has_commitment') and not commitment_info.get('can_cancel'):
            # Schedule cancellation at the end of the commitment period (1 year anniversary)
            commitment_end_date = datetime.fromisoformat(commitment_info.get('commitment_end_date').replace('Z', '+00:00'))
            cancel_at_timestamp = int(commitment_end_date.timestamp())
            
            # Update subscription to cancel at the commitment end date
            updated_subscription = await stripe.Subscription.modify_async(
                subscription_id,
                cancel_at=cancel_at_timestamp,
                metadata={
                    **subscription.get('metadata', {}),
                    'cancelled_by_user': 'true',
                    'cancellation_date': str(int(datetime.now(timezone.utc).timestamp())),
                    'scheduled_cancel_at_commitment_end': 'true'
                }
            )
            
            logger.debug(f"Subscription {subscription_id} scheduled for cancellation at commitment end: {commitment_end_date}")
            
            return {
                "success": True,
                "status": "scheduled_for_commitment_end",
                "message": f"Subscription will be cancelled at the end of your yearly commitment period. {commitment_info.get('months_remaining', 0)} months remaining.",
                "details": {
                    "subscription_id": subscription_id,
                    "cancellation_effective_date": commitment_end_date.isoformat(),
                    "months_remaining": commitment_info.get('months_remaining', 0),
                    "access_until": commitment_end_date.strftime("%B %d, %Y"),
                    "commitment_end_date": commitment_info.get('commitment_end_date')
                }
            }
        
        # For non-commitment subscriptions or commitment period has ended, cancel at period end
        updated_subscription = await stripe.Subscription.modify_async(
            subscription_id,
            cancel_at_period_end=True,
            metadata={
                **subscription.get('metadata', {}),
                'cancelled_by_user': 'true',
                'cancellation_date': str(int(datetime.now(timezone.utc).timestamp()))
            }
        )

        logger.debug(f"Subscription {subscription_id} marked for cancellation at period end")
        
        # Calculate when the subscription will actually end
        current_period_end = updated_subscription.current_period_end or subscription.get('current_period_end')
        
        # If still no period end, fetch fresh subscription data from Stripe
        if not current_period_end:
            logger.warning(f"No current_period_end found in cached data for subscription {subscription_id}, fetching fresh data from Stripe")
            try:
                fresh_subscription = await stripe.Subscription.retrieve_async(subscription_id)
                current_period_end = fresh_subscription.current_period_end
            except Exception as fetch_error:
                logger.error(f"Failed to fetch fresh subscription data: {fetch_error}")
        
        if not current_period_end:
            logger.error(f"No current_period_end found in subscription {subscription_id} even after fresh fetch")
            raise HTTPException(status_code=500, detail="Unable to determine subscription period end")
        
        period_end_date = datetime.fromtimestamp(current_period_end, timezone.utc)
        
        return {
            "success": True,
            "status": "cancelled_at_period_end",
            "message": "Subscription will be cancelled at the end of your current billing period.",
            "details": {
                "subscription_id": subscription_id,
                "cancellation_effective_date": period_end_date.isoformat(),
                "current_period_end": current_period_end,
                "access_until": period_end_date.strftime("%B %d, %Y")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing cancellation request")

@router.post("/reactivate-subscription")
async def reactivate_subscription(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Reactivate a subscription that was marked for cancellation."""
    try:
        # Get user's current subscription
        subscription = await get_user_subscription(current_user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="No subscription found")
        
        subscription_id = subscription['id']
        
        # Check if subscription is marked for cancellation (either cancel_at_period_end or cancel_at)
        is_cancelled = subscription.get('cancel_at_period_end') or subscription.get('cancel_at')
        if not is_cancelled:
            return {
                "success": False,
                "status": "not_cancelled",
                "message": "Subscription is not marked for cancellation."
            }
        
        # Prepare the modification parameters
        modify_params = {
            'cancel_at_period_end': False,
            'metadata': {
                **subscription.get('metadata', {}),
                'reactivated_by_user': 'true',
                'reactivation_date': str(int(datetime.now(timezone.utc).timestamp()))
            }
        }
        
        # If subscription has cancel_at set (yearly commitment), clear it
        if subscription.get('cancel_at'):
            modify_params['cancel_at'] = None
        
        # Reactivate the subscription
        updated_subscription = await stripe.Subscription.modify_async(
            subscription_id,
            **modify_params
        )
        
        logger.debug(f"Subscription {subscription_id} reactivated by user")
        
        # Get the current period end safely
        current_period_end = updated_subscription.current_period_end or subscription.get('current_period_end')
        
        # If still no period end, fetch fresh subscription data from Stripe
        if not current_period_end:
            logger.warning(f"No current_period_end found in cached data for subscription {subscription_id}, fetching fresh data from Stripe")
            try:
                fresh_subscription = await stripe.Subscription.retrieve_async(subscription_id)
                current_period_end = fresh_subscription.current_period_end
            except Exception as fetch_error:
                logger.error(f"Failed to fetch fresh subscription data: {fetch_error}")
        
        if not current_period_end:
            logger.error(f"No current_period_end found in subscription {subscription_id} even after fresh fetch")
            raise HTTPException(status_code=500, detail="Unable to determine subscription period end")
        
        return {
            "success": True,
            "status": "reactivated",
            "message": "Subscription has been reactivated and will continue billing normally.",
            "details": {
                "subscription_id": subscription_id,
                "next_billing_date": datetime.fromtimestamp(
                    current_period_end, 
                    timezone.utc
                ).strftime("%B %d, %Y")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reactivating subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing reactivation request")

@router.post("/purchase-credits")
async def purchase_credits(
    request: PurchaseCreditsRequest,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """
    Create a Stripe checkout session for purchasing credits.
    Available for all users (no subscription required).
    """
    try:
        # Validate amount
        if request.amount_dollars < 1:
            raise HTTPException(status_code=400, detail="Minimum credit purchase is $1")
        
        if request.amount_dollars > 5000:
            raise HTTPException(status_code=400, detail="Maximum credit purchase is $5000")
        
        # Get Supabase client
        db = DBConnection()
        client = await db.client
        
        # Get user email
        user_result = await client.auth.admin.get_user_by_id(current_user_id)
        if not user_result:
            raise HTTPException(status_code=404, detail="User not found")
        email = user_result.user.email
        
        # Get or create Stripe customer
        customer_id = await get_stripe_customer_id(client, current_user_id)
        if not customer_id:
            customer_id = await create_stripe_customer(client, current_user_id, email)
        
        # Check if we have a pre-configured price ID for this amount
        matching_package = None
        for package_key, package_info in CREDIT_PACKAGES.items():
            if package_info['amount'] == request.amount_dollars and package_info.get('stripe_price_id'):
                matching_package = package_info
                break
        
        # Map specific known package prices to fixed credits
        FIXED_CREDIT_PACKAGES = {
            11.99: 1000,  # $11.99 → 1,000 credits
            28.99: 2500,  # $28.99 → 2,500 credits
            55.99: 5000,  # $55.99 → 5,000 credits
        }
        
        fixed_credits = FIXED_CREDIT_PACKAGES.get(round(request.amount_dollars, 2))
        
        # Create a checkout session
        if matching_package and matching_package['stripe_price_id']:
            # Use pre-configured price ID
            session = await stripe.checkout.Session.create_async(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': matching_package['stripe_price_id'],
                    'quantity': 1,
                }],
                mode='payment',
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                metadata={
                    'user_id': current_user_id,
                    # Store the credit amount in DOLLARS so webhook can add precisely credits/100 dollars
                    'credit_amount': str((fixed_credits / 100) if fixed_credits else request.amount_dollars),
                    'type': 'credit_purchase'
                }
            )
        else:
            session = await stripe.checkout.Session.create_async(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                                    'name': f'Helium AI Credits',
        'description': f'${request.amount_dollars:.2f} in usage credits for Helium AI',
                        },
                        'unit_amount': int(request.amount_dollars * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                metadata={
                    'user_id': current_user_id,
                    'credit_amount': str((fixed_credits / 100) if fixed_credits else request.amount_dollars),
                    'type': 'credit_purchase'
                }
            )
        
        # Record the pending purchase in database
        purchase_record = await client.table('credit_purchases').insert({
            'user_id': current_user_id,
            'amount_dollars': request.amount_dollars,
            'status': 'pending',
            'stripe_payment_intent_id': session.payment_intent,
            'description': f'Credit purchase via Stripe Checkout',
            'metadata': {
                'session_id': session.id,
                'checkout_url': session.url,
                'success_url': request.success_url,
                'cancel_url': request.cancel_url
            }
        }).execute()
        
        return {
            "session_id": session.id,
            "url": session.url,
            "purchase_id": purchase_record.data[0]['id'] if purchase_record.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating credit purchase session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating checkout session: {str(e)}")

@router.get("/credit-balance")
async def get_credit_balance_endpoint(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get the current credit balance for the user."""
    try:
        db = DBConnection()
        client = await db.client
        
        balance = await get_user_credit_balance(client, current_user_id)
        
        return balance
        
    except Exception as e:
        logger.error(f"Error getting credit balance: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving credit balance")

@router.get("/credit-history")
async def get_credit_history(
    page: int = 0,
    items_per_page: int = 50,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get credit purchase and usage history for the user."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Get purchases
        purchases_result = await client.table('credit_purchases') \
            .select('*') \
            .eq('user_id', current_user_id) \
            .eq('status', 'completed') \
            .order('created_at', desc=True) \
            .range(page * items_per_page, (page + 1) * items_per_page - 1) \
            .execute()
        
        # Get usage
        usage_result = await client.table('credit_usage') \
            .select('*') \
            .eq('user_id', current_user_id) \
            .order('created_at', desc=True) \
            .range(page * items_per_page, (page + 1) * items_per_page - 1) \
            .execute()
        
        # Format response
        purchases = [
            CreditPurchase(
                id=p['id'],
                amount_dollars=float(p['amount_dollars']),
                status=p['status'],
                created_at=p['created_at'],
                completed_at=p.get('completed_at'),
                stripe_payment_intent_id=p.get('stripe_payment_intent_id')
            )
            for p in (purchases_result.data or [])
        ]
        
        usage = [
            CreditUsage(
                id=u['id'],
                amount_dollars=float(u['amount_dollars']),
                description=u.get('description'),
                created_at=u['created_at'],
                thread_id=u.get('thread_id'),
                message_id=u.get('message_id')
            )
            for u in (usage_result.data or [])
        ]
        
        return {
            "purchases": purchases,
            "usage": usage,
            "page": page,
            "has_more": len(purchases) == items_per_page or len(usage) == items_per_page
        }
        
    except Exception as e:
        logger.error(f"Error getting credit history: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving credit history")

@router.get("/can-purchase-credits")
async def can_purchase_credits(
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Check if the current user can purchase credits (now available for all users)."""
    try:
        return {
            "can_purchase": True,
            "reason": "Credit purchases are available for all users"
        }
    except Exception as e:
        logger.error(f"Error checking credit purchase eligibility: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking eligibility")

@router.get("/thread-credit-usage/{thread_id}")
async def get_thread_credit_usage(
    thread_id: str,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get credit usage for a specific thread."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Verify thread access
        thread_result = await client.table('threads').select('account_id').eq('thread_id', thread_id).execute()
        if not thread_result.data:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        thread = thread_result.data[0]
        if thread['account_id'] != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied to this thread")
        
        # Get credit usage for this thread
        credit_usage_result = await client.table('credit_usage') \
            .select('amount_dollars, created_at, description, message_id') \
            .eq('user_id', current_user_id) \
            .eq('thread_id', thread_id) \
            .order('created_at', desc=True) \
            .execute()
        
        if not credit_usage_result.data:
            return {
                "total_credits_used": 0.0,
                "usage_count": 0,
                "usage_details": []
            }
        
        # Calculate total credits used
        total_credits_used = sum(float(usage['amount_dollars']) for usage in credit_usage_result.data)
        usage_count = len(credit_usage_result.data)
        
        # Format usage details
        usage_details = [
            {
                "amount": float(usage['amount_dollars']),
                "created_at": usage['created_at'],
                "description": usage.get('description', ''),
                "message_id": usage.get('message_id')
            }
            for usage in credit_usage_result.data
        ]
        
        return {
            "total_credits_used": total_credits_used,
            "usage_count": usage_count,
            "usage_details": usage_details
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting thread credit usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving thread credit usage")

@router.get("/thread-token-usage/{thread_id}")
async def get_thread_token_usage(
    thread_id: str,
    current_user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Get token usage for a specific thread."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Check if we're in local development mode
        if config.ENV_MODE == EnvMode.LOCAL:
            logger.debug("Running in local development mode - thread token usage not available")
            return {
                "total_completion_tokens": 0,
                "total_prompt_tokens": 0,
                "total_tokens": 0,
                "estimated_cost": 0.0,
                "request_count": 0,
                "models": [],
                "message": "Thread token usage is not available in local development mode"
            }
        
        # Verify thread access
        thread_result = await client.table('threads').select('account_id').eq('thread_id', thread_id).execute()
        if not thread_result.data:
            raise HTTPException(status_code=404, detail="Thread not found")
        
        thread = thread_result.data[0]
        if thread['account_id'] != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied to this thread")
        
        # Get usage logs for this specific thread
        usage_result = await client.table('usage_logs') \
            .select('content, total_tokens, estimated_cost, created_at') \
            .eq('thread_id', thread_id) \
            .eq('user_id', current_user_id) \
            .order('created_at', desc=True) \
            .execute()
        
        if not usage_result.data:
            return {
                "total_completion_tokens": 0,
                "total_prompt_tokens": 0,
                "total_tokens": 0,
                "estimated_cost": 0.0,
                "request_count": 0,
                "models": []
            }
        
        # Calculate totals
        total_completion_tokens = 0
        total_prompt_tokens = 0
        total_tokens = 0
        estimated_cost = 0.0
        models = set()
        
        for log in usage_result.data:
            content = log.get('content', {})
            usage = content.get('usage', {})
            
            total_completion_tokens += usage.get('completion_tokens', 0)
            total_prompt_tokens += usage.get('prompt_tokens', 0)
            total_tokens += log.get('total_tokens', 0)
            
            cost = log.get('estimated_cost')
            if isinstance(cost, (int, float)):
                estimated_cost += cost
            
            model = content.get('model', '')
            if model:
                models.add(model)
        
        return {
            "total_completion_tokens": total_completion_tokens,
            "total_prompt_tokens": total_prompt_tokens,
            "total_tokens": total_tokens,
            "estimated_cost": estimated_cost,
            "request_count": len(usage_result.data),
            "models": list(models)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting thread token usage: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving thread token usage")
