import ss from 'simple-statistics';
import { slopeToDegree, customTransform } from '../../utils/basic';

export const findTrend = (timeSeries:number[] = [], basicTreshold = 8): any => {
	timeSeries = customTransform(timeSeries);
	const toFeed = timeSeries.map((val: number, idx: number) => [idx, val]);
	const lin = ss.linearRegression(toFeed);
	const slope = lin.m;
	const slopeInDegree = slopeToDegree(slope);
	const model = ss.linearRegressionLine(lin);
	if (Math.abs(slopeInDegree) < basicTreshold) return { trend: 'flat', slopeInDegree, model, timeSeries };
	if (slopeInDegree > 0) return { trend: 'up', slopeInDegree, model, timeSeries };
	else if (slopeInDegree < 0) return { trend: 'down', slopeInDegree, model, timeSeries };
};
