import { JSX } from "react";
import { BsPauseFill, BsEyeSlashFill } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";
import { FaBan } from "react-icons/fa";
import type { TrackingStatus } from "@src/types/tracking";

export interface TrackingStatusOption {
	label: string;
	data: TrackingStatus;
	description: string;
	icon: JSX.Element;
	color: string;
}

export const TRACKING_STATUS_OPTIONS: TrackingStatusOption[] = [
	{
		label: "Default",
		data: "default",
		description: "Shown in all statistics UI. New sessions are tracked.",
		icon: <IoMdSettings size={18} />,
		color: "#66c0f4",
	},
	{
		label: "Pause",
		data: "pause",
		description: "Shown in all statistics UI. New sessions aren't tracked.",
		icon: <BsPauseFill size={18} />,
		color: "#ff9966",
	},
	{
		label: "Hidden",
		data: "hidden",
		description: "Hidden from all statistics UI. Still tracked in background.",
		icon: <BsEyeSlashFill size={18} />,
		color: "#8b929a",
	},
	{
		label: "Ignore",
		data: "ignore",
		description: "Hidden from all statistics UI. Not tracked.",
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
