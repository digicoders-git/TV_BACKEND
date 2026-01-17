import React from 'react'

function Btn({ btclass, btname, bticon, btnclick }) {
    return (
        <div onClick={() => btnclick()} className={`flex items-center justify-center gap-2  text-white text-sm font-semibold px-4 py-2 rounded cursor-pointer ${btclass}`}>
            {bticon && <i className={bticon}></i>}

            <div>{btname}</div>
        </div>
    )
}

export default Btn