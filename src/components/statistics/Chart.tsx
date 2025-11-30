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
	type ChartType,
	type ChartDataset,
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
);

interface ChartProps {
	type: ChartType;
	labels: string[];
	datasets: ChartDataset[];
	options?: ChartOptions;
	style?: React.CSSProperties;
	height?: number;
}

export function Chart({
	type,
	labels,
	datasets,
	options,
	style,
	height = 300,
}: ChartProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartRef = useRef<ChartJS | null>(null);

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}
		if (chartRef.current) {
			chartRef.current.destroy();
		}

		const ctx = canvasRef.current.getContext("2d");

		if (!ctx) {
			return;
		}

		chartRef.current = new ChartJS(ctx, {
			type,
			data: { labels, datasets },
			options: options || {},
		});

		return () => {
			if (chartRef.current) chartRef.current.destroy();
		};
	}, [type, labels, datasets, options]);

	return <canvas ref={canvasRef} style={style} height={height} />;
}
