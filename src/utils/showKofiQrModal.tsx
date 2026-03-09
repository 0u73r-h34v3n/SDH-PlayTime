import { ModalRoot, showModal } from "@decky/ui";
import KoFi from "@src/components/KoFi";
import { KOFI_URL } from "@src/components/SupportBanner";

const showKofiQrModal = () => {
	showModal(
		<ModalRoot>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "12px",
				}}
			>
				<div style={{ width: 256, height: 256 }}>
					<KoFi />
				</div>

				<span
					style={{
						textAlign: "center",
						wordBreak: "break-word",
						color: "#8b929a",
						fontSize: "13px",
					}}
				>
					{KOFI_URL}
				</span>
			</div>
		</ModalRoot>,
		window,
	);
};

export default showKofiQrModal;
