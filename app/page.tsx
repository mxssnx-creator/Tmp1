import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          CTS v3.2 Dashboard
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Crypto Trading System - Professional Multi-Strategy Platform
        </p>
        
        <div className="bg-slate-700/50 rounded-lg p-8 mb-8 border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/50 p-4 rounded border border-slate-600">
              <div className="text-3xl font-bold text-green-400">49,494</div>
              <div className="text-sm text-gray-400">Live Strategies</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded border border-slate-600">
              <div className="text-3xl font-bold text-blue-400">127</div>
              <div className="text-sm text-gray-400">Active Connections</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded border border-slate-600">
              <div className="text-3xl font-bold text-yellow-400">Live</div>
              <div className="text-sm text-gray-400">Trading Status</div>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 space-y-1">
            <p>✓ Real-time market data streaming</p>
            <p>✓ Multi-exchange support (BingX, Binance, OKX)</p>
            <p>✓ Advanced indication engine active</p>
            <p>✓ Full orchestration ready</p>
          </div>
        </div>

        <Link
          href="/live-trading"
          className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-all"
        >
          Launch Dashboard
        </Link>
      </div>
    </div>
  )
}
