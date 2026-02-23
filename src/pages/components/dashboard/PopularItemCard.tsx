import { PopularItem } from "@/model/PopularItem";

const PopularItemCard = ({ item }: { item: PopularItem }) => {
  return (
    // Changed w-full to fixed width for slider compatibility
    <div className="min-w-[220px] w-[220px] bg-white rounded-2xl shadow-sm border border-gray-100 relative group select-none overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      {/* Image Container */}
      <div className="relative h-[180px] w-full overflow-hidden bg-gray-50">
        <img
          src={item.item.thumbnail.url}
          alt={item.item.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none"
        />
        {/* Manufacturer Badge - Rounded Green Tag text */}
        <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-md rounded-lg px-2.5 py-1 shadow-sm">
          <span className="text-[10px] font-extrabold text-white uppercase tracking-widest leading-none block">
            {item.item.brand}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 text-left">
        <h5 className="font-extrabold text-sm text-gray-800 truncate tracking-tight mb-3">
          {item.item.name}
        </h5>

        {/* Technical Spec Label for Sales */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
            Units Sold
          </span>
          <span className="text-sm font-extrabold text-green-600 font-mono">
            {item.soldCount.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PopularItemCard;
