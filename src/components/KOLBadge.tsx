interface KOLBadgeProps {
    size?: number;
    className?: string;
}

// Red KOL identity badge — shown on KOL profiles and KOL hub cards
export default function KOLBadge({ size = 18, className = '' }: KOLBadgeProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M12 2L13.8 5.2L17.4 4L17.2 7.8L20.8 9L19 12L20.8 15L17.2 16.2L17.4 20L13.8 18.8L12 22L10.2 18.8L6.6 20L6.8 16.2L3.2 15L5 12L3.2 9L6.8 7.8L6.6 4L10.2 5.2L12 2Z"
                fill="#dc2626"
                stroke="#b91c1c"
                strokeWidth="0.5"
            />
            <path
                d="M8.5 12L10.8 14.5L15.5 9.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
