import ComposioIcon from './ComposioIcon'

export default function LinkedIn() {
    return (
        <ComposioIcon 
            toolkitSlug="linkedin"
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
                        fill="#0077B5"
                    />
                    <path
                        d="M7.5 11.5h3v9h-3v-9zm1.5-4.5c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8.8-1.8 1.8-1.8zm6.5 4.5h2.8v1.2h.1c.4-.7 1.3-1.4 2.7-1.4 2.9 0 3.4 1.9 3.4 4.4v5.1h-3v-4.8c0-1.1 0-2.6-1.6-2.6s-1.8 1.2-1.8 2.5v4.9h-3v-9z"
                        fill="white"
                    />
                </svg>
            }
        />
    )
}
