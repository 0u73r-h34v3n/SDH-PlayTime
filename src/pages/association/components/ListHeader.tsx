export function ListHeader() {
	return (
		<div
			style={{
				display: "flex",
				padding: "8px 12px",
				fontSize: "11px",
				fontWeight: 600,
				color: "#8b929a",
				textTransform: "uppercase",
				letterSpacing: "0.5px",
				gap: "12px",
			}}
		>
			<div style={{ flex: 1 }}>Parent Game</div>
			<div style={{ width: "24px" }} /> {/* Space for link icon */}
			<div style={{ flex: 1 }}>Child Game</div>
			<div style={{ width: "30px" }} /> {/* Space for delete button */}
		</div>
	);
}
