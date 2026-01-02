import { BsPauseFill, BsEyeSlashFill } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";
import { FaBan } from "react-icons/fa";
import type { TrackingStatus } from "@src/types/tracking";
import { STATUS_COLORS } from "./constants";
import { JSX } from "react";

export const getStatusLabel = (status: TrackingStatus): string => {
	const labels: Record<TrackingStatus, string> = {
		default: "Default",
		pause: "Pause",
		hidden: "Hidden",
		ignore: "Ignore",
	};
	return labels[status] || status;
};

export const getStatusColor = (status: TrackingStatus): string => {
	return STATUS_COLORS[status] || STATUS_COLORS.default;
};

export const getStatusIcon = (status: TrackingStatus, size = 16) => {
	const icons: Record<TrackingStatus, JSX.Element> = {
		default: <IoMdSettings size={size} />,
		pause: <BsPauseFill size={size} />,
		hidden: <BsEyeSlashFill size={size} />,
		ignore: <FaBan size={size - 2} />,
	};
	return icons[status] || icons.default;
};
