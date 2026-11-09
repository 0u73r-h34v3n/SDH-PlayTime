import type { JSX } from "react";
import { BsPauseFill, BsEyeSlashFill } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";
import { FaBan } from "react-icons/fa";
import type { TrackingStatus } from "@src/types/tracking";
import { t } from "@src/i18n";

export interface TrackingStatusOption {
	label: string;
	data: TrackingStatus;
	description: string;
	icon: JSX.Element;
	color: string;
}

export const TRACKING_STATUS_OPTIONS: TrackingStatusOption[] = [
	{
		label: t("tracking.default"),
		data: "default",
		description: t("tracking.defaultDescription"),
		icon: <IoMdSettings size={18} />,
		color: "#66c0f4",
	},
	{
		label: t("tracking.pause"),
		data: "pause",
		description: t("tracking.pauseDescription"),
		icon: <BsPauseFill size={18} />,
		color: "#ff9966",
	},
	{
		label: t("tracking.hidden"),
		data: "hidden",
		description: t("tracking.hiddenDescription"),
		icon: <BsEyeSlashFill size={18} />,
		color: "#8b929a",
	},
	{
		label: t("tracking.ignore"),
		data: "ignore",
		description: t("tracking.ignoreDescription"),
		icon: <FaBan size={16} />,
		color: "#c41e3a",
	},
];

export const STATUS_COLORS: Record<TrackingStatus, string> = {
	default: "#66c0f4",
	pause: "#ff9966",
	hidden: "#8b929a",
	ignore: "#c41e3a",
};
