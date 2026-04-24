const SMARTSTORE_URL = 'https://smartstore.naver.com/rawrshop/products/13449033242'

export default function ShopPage() {
  return (
    <div className="pt-20 flex items-center justify-center min-h-screen px-8">
      <div className="max-w-sm w-full">
        <div className="w-full aspect-square bg-white mb-4" />
        <div className="text-white">
          <h2 className="uppercase tracking-widest text-lg mb-2">sample</h2>
          <p className="text-accent text-base mb-6">100 KRW</p>
          <a
            href={SMARTSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 border border-accent text-accent uppercase tracking-widest text-sm text-center hover:bg-accent hover:text-black transition-colors"
          >
            Buy on SmartStore
          </a>
        </div>
      </div>
    </div>
  )
}
