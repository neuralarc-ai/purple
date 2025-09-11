import ComposioIcon from './ComposioIcon'

export default function GoogleCalendar() {
    return (
        <ComposioIcon 
            toolkitSlug="google_calendar"
            className="size-8"
            fallbackIcon={
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-8">
                    <path
                        d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0z"
                        fill="#4285F4"
                    />
                    <path
                        d="M8 6h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2zm0 2v2h16V8H8zm16 4H8v12h16V12zm-12 2h8v2h-8v-2zm0 4h8v2h-8v-2z"
                        fill="white"
                    />
                </svg>
            }
        />
    )
}
