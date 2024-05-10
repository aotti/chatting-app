export default function Profile() {
    const displayName = 'Wawanto'
    return (
        <div className="hidden
            border-2 border-black absolute right-2 p-2 w-2/3 h-3/4
            md:w-1/4">
            {/* display name */}
            <p className="mb-2 font-semibold">
                {
                    displayName ? `My Profile (${displayName})` : "Other's Profile" 
                }
            </p>
            {/* profile picture */}
            <div className=" w-36 h-36 border-2">
                <img src="" alt="pic 144x144" />
            </div>
            {/* status */}
            <div className=" text-green-400">
                <p> Online </p>
            </div>
            {/* num of group */}
            <div>
                <p> Joined group: 4 </p>
            </div>
            {/* description */}
            <div>
                <p> 
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ducimus maiores fugiat harum quae a assumenda minima architecto officia facilis, incidunt at. Dolores aspernatur fuga quam consequatur veniam dolorum vitae maiores. 
                </p>
            </div>
        </div>
    )
}