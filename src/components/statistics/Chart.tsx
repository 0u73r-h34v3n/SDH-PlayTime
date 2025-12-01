import { useEffect, useRef } from "react";
import {
	BarController,
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	LinearScale,
	Title,
	Tooltip,
	PieController,
	ArcElement,
	Legend,
	type ChartType,
	type ChartData,
	type ChartOptions,
} from "chart.js";

ChartJS.register(
	BarController,
	BarElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	PieController,
	ArcElement,
	Legend,
);

export const CHART_COLORS = {
	primary: "#008ADA",
	secondary: "#FFD500",
	grid: "rgba(255, 255, 255, 0.1)",
	text: "rgba(255, 255, 255, 0.7)",
	transparent: "rgba(0, 0, 0, 0)",
} as const;

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
	animation: {
		duration: 300,
	},
} as const;

interface ChartProps<TType extends ChartType = ChartType> {
	type: TType;
	data: ChartData<TType>;
	options?: ChartOptions<TType>;
	style?: React.CSSProperties;
	height?: number;
}

export function Chart<TType extends ChartType = ChartType>({
	type,
	data,
	options,
	style,
	height = 300,
}: ChartProps<TType>) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartRef = useRef<ChartJS<TType> | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const ctx = canvas.getContext("2d");

		if (!ctx) {
			return;
		}

		chartRef.current = new ChartJS(ctx, {
			type,
			data,
			options: { ...DEFAULT_CHART_OPTIONS, ...options } as ChartOptions<TType>,
		});

		return () => {
			if (chartRef.current) {
				chartRef.current.destroy();
				chartRef.current = null;
			}
		};
	}, [type]);

	useEffect(() => {
		const chart = chartRef.current;

		if (!chart) {
			return;
		}

		chart.data = data;
		chart.options = {
			...DEFAULT_CHART_OPTIONS,
			...options,
		} as ChartOptions<TType>;

		chart.update("none");
	}, [data, options]);

	return <canvas ref={canvasRef} style={style} height={height} />;
}
