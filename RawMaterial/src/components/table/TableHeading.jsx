import React from "react";
const TableHeading = ({list}) =>{
    return(
        <>
            <thead className="sticky top-0 z-20 text-xs bg-ink-950 text-ink-100 uppercase tracking-wider">
                <tr>
                    {list.map((item, index) => (
                        <th key={index} scope="col" className='px-4 py-3 text-center font-semibold first:border-l-4 first:border-brand-400'>
                            {item}
                        </th>
                    ))}
                </tr>
            </thead>
            
        </>
    );
}

export default TableHeading;