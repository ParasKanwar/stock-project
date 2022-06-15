/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { KiteTicker, KiteConnect } from 'kiteconnect';
import { KiteService } from '../utils/kite';
import { dateFromNow } from '../utils/basic';
// @ts-ignore
import TimerQueue from 'timer-queue';
import { Logger } from 'sitka';

type tick = any;
type timeseries = any;

interface Subscriber {
  onTicks: (ticks: tick) => void;
  onTimeSeries: (timeseries: timeseries) => void;
}

interface instrumentSubscription {
  instrument_id: number;
  mode: 'full' | 'quote';
  subscriber: Subscriber;
}

export class CustomKiteTicker {
	private static instance: CustomKiteTicker;
	private kiteTicker: KiteTicker;
	private kiteConnect: KiteConnect;
	private initialized = false;
	private subscribers: { [key: number]: Subscriber[] } = {};
	private minutesCandle = 5;
	private timeseriesData: { [key: number]: timeseries[] } = {};
	private lastUpdatedTimestamp: Date | string = new Date(dateFromNow({ days: 30 }));
	private timerQueue: TimerQueue = new TimerQueue({
		interval: 350,
		timeout: 3000,
		retry: 3,
		retryInterval: 200,
		autostart: true,
	});
	// private subscribers: instrumentSubscription[];
	static getInstance(): CustomKiteTicker {
		if (!this.instance) {
			this.instance = new CustomKiteTicker();
		}
		return this.instance;
	}
	public async initialize() {
		if (this.initialized) {
			return;
		}
		this.kiteTicker = await KiteService.getKiteTicker();
		this.kiteConnect = await KiteService.getKiteConnect();
		this.kiteTicker.connect();
		this.kiteTicker.autoReconnect(true, 10, 5);
		await new Promise((res) => this.kiteTicker.on('connect', res));
		this.kiteTicker.on('ticks', this.onTicks.bind(this));
		this.initialized = true;
		setInterval(() => {
			if (Math.abs(new Date(this.lastUpdatedTimestamp).getTime() - new Date().getTime()) > this.minutesCandle * 60 * 1000) {
				Logger.getLogger().info('updating ticker data');
				for (const token of Object.keys(this.subscribers)) {
					this.timerQueue.push(() => {
						this.refreshHistoricalData(parseInt(token));
					});
				}
				this.timerQueue.start();
			} else {
				Logger.getLogger().info('not updating ticker data. last traded time', this.lastUpdatedTimestamp);
			}
		}, 1000);
	}

	private async onTicks(ticks: tick[]) {
		for (const tick of ticks) {
			this.subscribers[tick.instrument_token]?.forEach((subscriber) => {
				subscriber.onTicks(tick);
			});
		}
	}

	public getZerodhaDateString(date: Date) {
		const year = date.getUTCFullYear();
		const month = date.getUTCMonth() + 1;
		const day = date.getUTCDate();
		const hour = date.getUTCHours();
		const minute = date.getUTCMinutes();
		const second = date.getUTCSeconds();
		return `${year < 10 ? '0' : ''}${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day} ${
			hour < 10 ? '0' : ''
		}${hour}:${minute < 10 ? '0' : ''}${minute}:${second < 10 ? '0' : ''}${second}`;
	}

	public getZerodhaDateStringConcise(date: Date) {
		const year = date.getUTCFullYear();
		const month = date.getUTCMonth() + 1;
		const day = date.getUTCDate();
		const date_ret = `${year < 10 ? '0' : ''}${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
		return date_ret;
	}

	public async refreshHistoricalData(instrumentToken: number) {
		const startDate = this.getZerodhaDateStringConcise(dateFromNow({ days: 2 }));
		const endDate = this.getZerodhaDateStringConcise(new Date());
		const data = await this.kiteConnect.getHistoricalData(instrumentToken, `${this.minutesCandle}minute`, startDate, endDate);
		this.timeseriesData[instrumentToken] = data;
		this.subscribers[instrumentToken].forEach((subscriber) => subscriber.onTimeSeries(data));
		this.lastUpdatedTimestamp = data[data.length - 1].date;
	}

	public async subscribe(subscription: instrumentSubscription) {
		this.kiteConnect
			.getHistoricalData(
				subscription.instrument_id,
				`${this.minutesCandle}minute`,
				this.getZerodhaDateStringConcise(dateFromNow({ days: 2 })),
				this.getZerodhaDateStringConcise(new Date())
			)
			.then((data: any) => {
				this.timeseriesData[subscription.instrument_id] = data;
				this.lastUpdatedTimestamp = data[data.length - 1].date;
			})
			.then(() => this.kiteTicker.subscribe([subscription.instrument_id]))
			.then(() => this.kiteTicker.setMode(subscription.mode, [subscription.instrument_id]))
			.then(() => subscription.subscriber.onTimeSeries(this.timeseriesData[subscription.instrument_id]))
			.catch(console.log);

		if (!this.subscribers[subscription.instrument_id]) {
			this.subscribers[subscription.instrument_id] = [];
		}
		this.subscribers[subscription.instrument_id].push(subscription.subscriber);
	}
}
