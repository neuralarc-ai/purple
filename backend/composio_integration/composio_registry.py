from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from utils.logger import logger


class AppCategory(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    priority: int = 0  # Lower numbers = higher priority


class CategorizedApp(BaseModel):
    slug: str
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    category_id: str
    category_name: str
    tags: List[str] = []
    auth_schemes: List[str] = []
    is_popular: bool = False
    priority: int = 0


class ComposioRegistry:
    """
    Registry for categorizing and organizing Composio apps
    """
    
    def __init__(self):
        self.categories = self._initialize_categories()
        self.popular_apps = self._initialize_popular_apps()
        self.category_mappings = self._initialize_category_mappings()
    
    def _initialize_categories(self) -> List[AppCategory]:
        """Initialize predefined categories with priority ordering"""
        return [
            AppCategory(id="popular", name="Popular", description="Most commonly used integrations", priority=1),
            AppCategory(id="productivity", name="Productivity", description="Tools to boost productivity", priority=2),
            AppCategory(id="communication", name="Communication", description="Chat, email, and messaging tools", priority=3),
            AppCategory(id="social-media", name="Social Media", description="Social media platforms and management tools", priority=4),
            AppCategory(id="crm", name="CRM", description="Customer relationship management", priority=5),
            AppCategory(id="project-management", name="Project Management", description="Task and project tracking", priority=6),
            AppCategory(id="marketing", name="Marketing", description="Marketing automation and analytics", priority=7),
            AppCategory(id="analytics", name="Analytics", description="Data analysis and reporting", priority=8),
            AppCategory(id="scheduling", name="Scheduling", description="Calendar and appointment tools", priority=9),
            # AppCategory(id="finance", name="Finance", description="Financial and accounting tools", priority=10),
            # AppCategory(id="development", name="Development", description="Developer tools and platforms", priority=11),
            # AppCategory(id="storage", name="Storage", description="File storage and sharing", priority=12),
            # AppCategory(id="ecommerce", name="E-commerce", description="Online store and payment tools", priority=13),
            # AppCategory(id="hr", name="Human Resources", description="HR and recruitment tools", priority=14),
            # AppCategory(id="other", name="Other", description="Miscellaneous integrations", priority=99)
        ]
    
    def _initialize_popular_apps(self) -> List[str]:
        """Define which apps should be marked as popular"""
        return [
            # Microsoft Suite - All Microsoft related apps first
            "outlook",
            
            # Google Suite - All Google related apps
            "gmail", "googledrive", "googlesheets", "googlecalendar", "googledocs", "googlesuper", "googleclassroom", "googletasks", "googlemaps", "googlemeet",
            
            # Additional Microsoft Suite apps
            "excel",
            
            # Other popular apps
            "notion", "github", "perplexityai", "supabase", "figma", "salesforce", "freshdesk", "zoho", "dropbox",
            
            # Social Media & Communication
            "twitter", "linkedin", "reddit"
        ]
    
    def _initialize_category_mappings(self) -> Dict[str, str]:
        """Map app slugs to category IDs"""
        return {
            # Google Suite - Popular apps
            "gmail": "communication",
            "googlesheets": "productivity", 
            "googledrive": "productivity",  # Changed from storage to productivity
            "googlecalendar": "scheduling",
            "googledocs": "productivity",
            "googlesuper": "productivity",
            "googleclassroom": "productivity",
            "googletasks": "productivity",
            "googlemaps": "productivity",
            "googlemeet": "communication",
            
            # Communication
            "slack": "communication",
            "outlook": "communication",
            "microsoftteams": "communication",
            "zoom": "communication",
            
            # Productivity
            "notion": "productivity",
            "airtable": "productivity",
            "evernote": "productivity",
            "onenote": "productivity",
            "obsidian": "productivity",
            "roam": "productivity",
            "dropbox": "productivity",  # Changed from storage to productivity
            "onedrive": "productivity",  # Changed from storage to productivity
            "box": "productivity",  # Changed from storage to productivity
            "excel": "productivity",
            "sharepoint": "productivity",
            
            # Project Management
            "trello": "project-management",
            "asana": "project-management", 
            "jira": "project-management",
            "linear": "project-management",
            "monday": "project-management",
            "clickup": "project-management",
            "basecamp": "project-management",
            "todoist": "project-management",
            
            # CRM
            "hubspot": "crm",
            "salesforce": "crm",
            "pipedrive": "crm",
            "intercom": "crm",
            "zendesk": "crm",
            "freshworks": "crm",
            "crm": "crm",
            
            # Marketing
            "mailchimp": "marketing",
            "klaviyo": "marketing",
            "sendgrid": "marketing",
            "constantcontact": "marketing",
            "campaignmonitor": "marketing",
            "convertkit": "marketing",
            
            # Scheduling
            "calendly": "scheduling",
            "acuityscheduling": "scheduling",
            "bookingcom": "scheduling",
            "when2meet": "scheduling",
            "doodle": "scheduling",
            
            # Analytics
            "googleanalytics": "analytics",
            "mixpanel": "analytics",
            "amplitude": "analytics",
            "hotjar": "analytics",
            "segment": "analytics",
            
            # Document Management & Productivity Tools
            "docusign": "productivity",
            "hellosign": "productivity",
            "pandadoc": "productivity",
            
            # Previously categorized apps now moved to existing categories
            # Finance apps -> Marketing (for payment/billing related marketing)
            "stripe": "marketing",
            "paypal": "marketing", 
            "quickbooks": "productivity",
            "xero": "productivity",
            "square": "marketing",
            
            # E-commerce -> Marketing
            "shopify": "marketing",
            "woocommerce": "marketing",
            "magento": "marketing",
            "bigcommerce": "marketing",
            
            # Social Media
            "twitter": "social-media",
            "facebook": "social-media",
            "instagram": "social-media",
            "linkedin": "social-media",
            "youtube": "social-media",
            "discord": "social-media",
            "reddit": "social-media",
            
            # Development -> Productivity
            "github": "productivity",
            "gitlab": "productivity",
            "bitbucket": "productivity",
            "figma": "productivity",
            "vercel": "productivity",
            "netlify": "productivity",
            "aws": "productivity",
            "docker": "productivity",
            "supabase": "productivity",
            "perplexityai": "productivity",
            "dropbox": "productivity",
            "zoho": "productivity",
            "freshdesk": "crm",
            
            # HR -> CRM (customer/employee relationship management)
            "bamboohr": "crm",
            "workday": "crm",
            "greenhouse": "crm",
            "lever": "crm",
        }
    
    def get_categories(self) -> List[AppCategory]:
        """Get all available categories sorted by priority"""
        return sorted(self.categories, key=lambda x: x.priority)
    
    def get_category_by_id(self, category_id: str) -> Optional[AppCategory]:
        """Get a specific category by ID"""
        for category in self.categories:
            if category.id == category_id:
                return category
        return None
    
    def categorize_app(self, app_slug: str, app_name: str, app_tags: List[str] = None) -> str:
        """
        Determine the category for an app based on its slug, name, and tags
        """
        app_slug_lower = app_slug.lower()
        app_name_lower = app_name.lower()
        app_tags = app_tags or []
        
        # Direct mapping from slug
        if app_slug_lower in self.category_mappings:
            return self.category_mappings[app_slug_lower]
        
        # Check if app name contains category keywords
        category_keywords = {
            "communication": ["chat", "message", "mail", "email", "call", "video", "meeting", "outlook"],
            "social-media": ["social", "twitter", "facebook", "instagram", "linkedin", "youtube", "discord", "reddit", "social media", "social network"],
            "crm": ["crm", "customer", "sales", "lead", "contact", "hr", "human", "employee", "recruitment", "hiring", "payroll"],
            "project-management": ["project", "task", "kanban", "scrum", "agile", "board"],
            "marketing": ["marketing", "campaign", "newsletter", "email marketing", "automation", "payment", "billing", "invoice", "shop", "store", "ecommerce", "commerce", "cart", "product", "klaviyo", "mailchimp"],
            "analytics": ["analytics", "tracking", "metrics", "dashboard", "report"],
            "scheduling": ["calendar", "schedule", "appointment", "booking", "meeting"],
            "productivity": ["productivity", "note", "document", "office", "workspace", "storage", "drive", "cloud", "file", "code", "git", "deploy", "api", "developer", "programming", "accounting", "finance", "github", "notion", "onedrive"]
        }
        
        # Check app name and tags against keywords
        for category_id, keywords in category_keywords.items():
            for keyword in keywords:
                if (keyword in app_name_lower or 
                    any(keyword in tag.lower() for tag in app_tags)):
                    return category_id
        
        # Default to "productivity" if no category matches (since "other" is commented out)
        return "productivity"
    
    def is_popular_app(self, app_slug: str) -> bool:
        """Check if an app should be marked as popular"""
        return app_slug.lower() in self.popular_apps
    
    def categorize_apps(self, apps: List[Dict[str, Any]]) -> Dict[str, List[CategorizedApp]]:
        """
        Categorize a list of apps and return them grouped by category
        """
        categorized = {}
        
        # Initialize all categories
        for category in self.categories:
            categorized[category.id] = []
        
        for app in apps:
            app_slug = app.get("slug", "")
            app_name = app.get("name", "")
            app_tags = app.get("tags", [])
            
            category_id = self.categorize_app(app_slug, app_name, app_tags)
            is_popular = self.is_popular_app(app_slug)
            
            # If app is popular, also add it to the popular category with priority based on popular_apps list order
            if is_popular:
                # Get the priority based on position in popular_apps list
                try:
                    priority = self.popular_apps.index(app_slug.lower())
                except ValueError:
                    priority = 999  # fallback for apps not in list
                
                popular_app = CategorizedApp(
                    slug=app_slug,
                    name=app_name,
                    description=app.get("description"),
                    logo=app.get("logo"),
                    category_id="popular",
                    category_name="Popular",
                    tags=app_tags,
                    auth_schemes=app.get("auth_schemes", []),
                    is_popular=True,
                    priority=priority
                )
                categorized["popular"].append(popular_app)
            
            # Add to its regular category
            category = self.get_category_by_id(category_id)
            if category:
                categorized_app = CategorizedApp(
                    slug=app_slug,
                    name=app_name,
                    description=app.get("description"),
                    logo=app.get("logo"),
                    category_id=category_id,
                    category_name=category.name,
                    tags=app_tags,
                    auth_schemes=app.get("auth_schemes", []),
                    is_popular=is_popular,
                    priority=1 if is_popular else 2
                )
                categorized[category_id].append(categorized_app)
        
        # Sort apps within each category
        for category_id in categorized:
            if category_id == "popular":
                # For popular category, sort by the priority (order in popular_apps list)
                categorized[category_id].sort(key=lambda x: x.priority)
            else:
                # For other categories, sort by priority first, then alphabetical
                categorized[category_id].sort(key=lambda x: (x.priority, x.name.lower()))
        
        # Remove empty categories
        categorized = {k: v for k, v in categorized.items() if v}
        
        return categorized
    
    def get_apps_by_category(self, apps: List[Dict[str, Any]], category_id: str) -> List[CategorizedApp]:
        """Get apps filtered by a specific category"""
        categorized = self.categorize_apps(apps)
        return categorized.get(category_id, [])
    
    def search_apps(self, apps: List[Dict[str, Any]], query: str, category_id: Optional[str] = None) -> List[CategorizedApp]:
        """Search apps with optional category filtering"""
        query_lower = query.lower()
        categorized = self.categorize_apps(apps)
        
        results = []
        categories_to_search = [category_id] if category_id else categorized.keys()
        
        for cat_id in categories_to_search:
            for app in categorized.get(cat_id, []):
                if (query_lower in app.name.lower() or 
                    (app.description and query_lower in app.description.lower()) or
                    any(query_lower in tag.lower() for tag in app.tags)):
                    results.append(app)
        
        # Sort results (popular first, then by relevance)
        results.sort(key=lambda x: (x.priority, x.name.lower()))
        return results


# Global registry instance
composio_registry = ComposioRegistry()