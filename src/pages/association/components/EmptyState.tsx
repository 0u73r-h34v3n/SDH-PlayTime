interface EmptyStateProps {
	title: string;
	description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
	return (
		<div
			style={{
				padding: "24px",
				textAlign: "center",
				color: "#8b929a",
			}}
		>
			<div
				style={{
					fontSize: "14px",
					fontWeight: 500,
					marginBottom: "4px",
				}}
			>
				{title}
			</div>
			<div style={{ fontSize: "12px" }}>{description}</div>
		</div>
	);
}
