import { Tabs } from "@decky/ui";
import { useState } from "react";
import { PageWrapper } from "../components/PageWrapper";
import { Tab } from "../components/Tab";
import { ReportMonthly } from "../containers/ReportMonthly";
import { ReportOverall } from "../containers/ReportOverall";
import { ReportWeekly } from "../containers/ReportWeekly";
import { $lastOpenedPage } from "@src/stores/ui";
import { t } from "@src/i18n";

export const DetailedPage = () => {
	const [currentTabRoute, setCurrentTabRoute] = useState<ReportPage>(
		$lastOpenedPage.get(),
	);

	return (
		<PageWrapper>
			<Tabs
				activeTab={currentTabRoute}
				onShowTab={(tabId: ReportPage) => {
					$lastOpenedPage.set(tabId);

					setCurrentTabRoute(tabId);
				}}
				autoFocusContents={true}
				tabs={[
					{
						title: t("report.allTime"),
						content: (
							<Tab>
								<ReportOverall />
							</Tab>
						),
						id: "all-time",
					},
					{
						title: t("report.byMonth"),
						content: (
							<Tab>
								<ReportMonthly />
							</Tab>
						),
						id: "by-month",
					},
					{
						title: t("report.byWeek"),
						content: (
							<Tab>
								<ReportWeekly />
							</Tab>
						),
						id: "by-week",
					},
				]}
			/>
		</PageWrapper>
	);
};
