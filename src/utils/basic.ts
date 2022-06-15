export const radToDegree = (rad: number) => {
	return rad * (180 / Math.PI);
};
  
export const logSeriesTransform = (series: number[], mul = 1000) => series.map((val) => Math.log(val) * mul);
  
export const customTransform = (series: number[]) => {
	const origin = series[0];
	const toRet = series.map((val) => ((val - origin) / origin) * 100000);
	return toRet;
};
  
export const slopeToDegree = (slope: number) => {
	return radToDegree(Math.atan(slope));
};
  
export const dateFromNow = ({ days }: { days: number }): Date => {
	const dateOffset = 24 * 60 * 60 * 1000 * days;
	const myDate = new Date();
	myDate.setTime(myDate.getTime() - dateOffset);
	return myDate;
};
