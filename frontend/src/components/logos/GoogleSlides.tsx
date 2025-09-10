import ComposioIcon from './ComposioIcon'

export default function GoogleSlides() {
    return (
        <ComposioIcon 
            toolkitSlug="google_slides"
            className="size-8"
            fallbackIcon={
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 48 48" className="size-8">
                    <path fill="#2196f3" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"></path>
                    <path fill="#bbdefb" d="M40 13L30 13 30 3z"></path>
                    <path fill="#1565c0" d="M30 13L40 23 40 13z"></path>
                    <path fill="#e3f2fd" d="M15 23H33V25H15zM15 27H33V29H15zM15 31H33V33H15zM15 35H25V37H15z"></path>
                </svg>
            }
        />
    )
}
