export default function ShopPage() {
  return (
    <div className="pt-20 flex items-center justify-center min-h-screen px-8">
      <div className="max-w-sm w-full">
        <div className="w-full aspect-square bg-white mb-4" />
        <div className="text-white">
          <h2 className="uppercase tracking-widest text-lg mb-2">sample</h2>
          <p className="text-accent text-base mb-6">100 KRW</p>
          <button
            disabled
            className="w-full py-3 border border-white/30 text-white/40 uppercase tracking-widest text-sm cursor-not-allowed"
          >
            Buy (준비 중)
          </button>
        </div>
      </div>
    </div>
  )
}
