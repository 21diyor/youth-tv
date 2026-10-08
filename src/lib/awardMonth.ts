const months=['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
export function previousMonthKey(current:string) {
 const [year,month]=current.split('-').map(Number)
 return month===1?`${year-1}-12`:`${year}-${String(month-1).padStart(2,'0')}`
}
export function awardMonthLabel(key:string|undefined) {
 if(!key||!/^\d{4}-(0[1-9]|1[0-2])$/.test(key))return ''
 const [year,month]=key.split('-')
 return `${months[Number(month)-1]} ${year}`
}
