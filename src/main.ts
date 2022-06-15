/* eslint-disable @typescript-eslint/ban-ts-comment */
// import { CustomKiteTicker } from './service/kite';
import { KiteTraderSingleton } from './service/trader';
import { someFunction } from './service/stratergies/momentum';

const main = async () => {
	// getNifty50().then(console.log);
	// getNifty100().then(console.log);
	const instance = KiteTraderSingleton.getInstance()
	await instance.initialize();
	someFunction();
	// instance.trade('SBIN', 'NSE', 455.55, 452.4).then(console.log);
	// const instance = CustomKiteTicker.getInstance();
	// await instance.initialize();
	// instance.subscribe({ instrument_id: 738561, mode: 'full', subscriber: { onTicks: () => null, onTimeSeries: (data) => console.log(data[data.length - 1]) } });
	// instance.subscribe({ instrument_id: 2863105, mode: 'full', subscriber: { onTicks: () => null, onTimeSeries: (data) => console.log(data[data.length - 1]) } });
};

export { main };
