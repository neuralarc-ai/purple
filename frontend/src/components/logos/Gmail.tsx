import ComposioIcon from './ComposioIcon'

export default function Gmail() {
    return (
        <ComposioIcon 
            toolkitSlug="gmail"
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
                        d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 2.667c7.364 0 13.333 5.969 13.333 13.333S23.364 29.333 16 29.333 2.667 23.364 2.667 16 8.636 2.667 16 2.667z"
                        fill="#EA4335"
                    />
                    <path
                        d="M16 6.667L6.667 16l9.333 9.333L25.333 16 16 6.667zm0 2.666l6.667 6.667L16 22.667 9.333 16 16 9.333z"
                        fill="#EA4335"
                    />
                </svg>
            }
        />
    )
}
