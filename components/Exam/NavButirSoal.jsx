export default function NavButirSoal({ number, isChosen, isRagu, onClick }) {
  return (
    <div className='col-span-1 relative' onClick={onClick}>
      <div
        className={`p-1 font-medium cursor-pointer border
                    ${
                      isRagu
                        ? "bg-yellow-500 text-white border-yellow-700"
                        : isChosen
                        ? "bg-green-500 text-white border-blue-400"
                        : "bg-gray-200 border-gray-600 text-gray-600"
                    } text-xs text-center rounded hover:transform hover:scale-105 focus:scale-95 `}>
        {number}
      </div>
    </div>
  );
}
