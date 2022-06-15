/* eslint-disable no-mixed-spaces-and-tabs */
import { KiteService } from '../utils/kite';

interface Trader {
  trade(tradingSymbol: string, exchange: string, stop_loss: number, ltp: number): Promise<void>;
  readonly tradesLeft: number;
  readonly maxRiskPerTrade: number;
  readonly riskToRewardRatio: number;
}

// interface order {
//   order_id: string;
//   instrument_token: number;
// }

export class KiteTraderSingleton implements Trader {
	private static instance: KiteTraderSingleton;
	private KiteConnectInstance: Promise<any> = KiteService.getKiteConnect();
	private KiteTickerInstance: Promise<any> = KiteService.getKiteTicker();
	private orders: {
    [key: string]: {
      ticker: string;
      type: 'stop_loss' | 'target' | 'placed';
      order_id: string;
      status: 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'TRIGGER PENDING' | 'REJECTED' | 'UPDATE';
    };
  } = {};
	private trades: { [key: string]: { stop_loss_order_id: string; target_order_id: string; placed_order_id: string } } = {};
	// private orders: { [key: string]: order[] } = {};
	public tradesLeft = 3;
	public maxRiskPerTrade = 300;
	public riskToRewardRatio = 2;
	async initialize() {
		await this.KiteConnectInstance;
		console.log(this.tradesLeft);
		console.log(this.maxRiskPerTrade);
		console.log(this.riskToRewardRatio);
		const kt = await this.KiteTickerInstance;
		kt.connect();
		kt.on('ticks', console.log);
		kt.on('order_update', this.onOrderUpdate.bind(this));
		kt.on('connect', () => console.log('connected'));
	}
	// private setStatus(data: { order_id: string; status: string }): void {
	// 	this.orders[data.order_id].status = data.status;
	// }

	private onStopLossUpdate(data: any): void {
		const tradingSymbol = data.tradingsymbol;
		const orderId = data.order_id;
		const status = data.status;
		this.orders[orderId].status = status;
		console.log(`${tradingSymbol} ${orderId} ${status}`);
	}
	private onPlacedUpdate(data: any): void {
		const tradingSymbol = data.tradingsymbol;
		const orderId = data.order_id;
		const status = data.status;
		this.orders[orderId].status = status;
		console.log(`${tradingSymbol} ${orderId} ${status}`);
	}
	private onTargetUpdate(data: any): void {
		const tradingSymbol = data.tradingsymbol;
		const orderId = data.order_id;
		const status = data.status;
		this.orders[orderId].status = status;
		console.log(`${tradingSymbol} ${orderId} ${status}`);
	}
	private waitForOrderId(order_id: string) {
		return new Promise((resolve, reject) => {
			const done = false;
			const interval = setInterval(() => {
				if (this.orders[order_id]) {
					clearInterval(interval);
					resolve('done');
				}
			}, 10);
			setTimeout(() => {
				if (!done) {
					clearInterval(interval);
					reject('timeout');
				}
			}, 3000);
		});
	}
	private async onOrderUpdate(data: any) {
		try{
			await this.waitForOrderId(data.order_id);
			console.log(this.trades);
			console.log(this.orders);
			console.log(data);
			switch (this.orders[data.order_id].type) {
			case 'stop_loss':
				this.onStopLossUpdate(data);
				break;
			case 'target':
				this.onTargetUpdate(data);
				break;
			case 'placed':
				this.onPlacedUpdate(data);
				break;
			}
		}catch(e){
			console.log('error inside on order update');
		}
	}
	private buildOrderParams({
		exchange,
		tradingSymbol,
		transaction_type,
		quantity,
		trigger_price,
		order_type,
		limit_price,
	}: any): any {
		return {
			exchange: exchange,
			tradingsymbol: tradingSymbol,
			transaction_type: transaction_type,
			quantity: quantity,
			product: 'MIS',
			trigger_price,
			price: limit_price,
			validity: 'DAY',
			order_type,
		};
	}
	async trade(tradingSymbol: string, exchange: string, stop_loss: number, ltp: number): Promise<void> {
		if (this.tradesLeft === 0) return console.log('No trades left');
		this.tradesLeft--;
		const kc = await this.KiteConnectInstance;
		const transaction_type = stop_loss < ltp ? 'BUY' : 'SELL';
		const target =
      transaction_type === 'BUY'
      	? ltp + this.riskToRewardRatio * Math.abs(stop_loss - ltp)
      	: ltp - this.riskToRewardRatio * Math.abs(stop_loss - ltp);
		console.log('target is', target);
		const quantity = 1 || Math.floor(this.maxRiskPerTrade / Math.abs(stop_loss - ltp));
		// placing plain-orders
		const placedOrder = await kc.placeOrder(
			'regular',
			this.buildOrderParams({
				exchange,
				tradingSymbol,
				transaction_type,
				quantity,
				limit_price: ltp,
				order_type: 'LIMIT',
				trigger_price: ltp,
			})
		);
		this.orders[placedOrder.order_id] = {
			ticker: tradingSymbol,
			type: 'placed',
			order_id: placedOrder.order_id,
			status: 'OPEN',
		};
		this.trades[tradingSymbol] = {
			stop_loss_order_id: '',
			placed_order_id: placedOrder.order_id,
			target_order_id: '',
		};
		// placing stop-losses
		const stopLossOrder = await kc.placeOrder(
			'regular',
			this.buildOrderParams({
				exchange,
				tradingSymbol,
				transaction_type: transaction_type === 'BUY' ? 'SELL' : 'BUY',
				quantity,
				limit_price: ltp,
				trigger_price: stop_loss,
				order_type: 'SL-M',
			})
		);
		this.orders[stopLossOrder.order_id] = {
			ticker: tradingSymbol,
			type: 'stop_loss',
			order_id: stopLossOrder.order_id,
			status: 'OPEN',
		};
		this.trades[tradingSymbol].stop_loss_order_id = stopLossOrder.order_id;
		const targetOrder = await kc.placeOrder(
			'regular',
			this.buildOrderParams({
				exchange,
				tradingSymbol,
				transaction_type: transaction_type === 'BUY' ? 'SELL' : 'BUY',
				quantity,
				limit_price: target,
				trigger_price: target,
				order_type: 'LIMIT',
			})
		);
		this.orders[targetOrder.order_id] = {
			ticker: tradingSymbol,
			type: 'target',
			order_id: targetOrder.order_id,
			status: 'OPEN',
		};
		this.trades[tradingSymbol].target_order_id = targetOrder.order_id;
	}
	public static getInstance(): KiteTraderSingleton {
		if (!this.instance) {
			this.instance = new KiteTraderSingleton();
		}
		return this.instance;
	}
}
