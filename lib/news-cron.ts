/** The cron endpoint authenticates its own Bearer secret, independently of browser cookies. */
export const isNewsCronRequest=(method:string,path:string)=>method==='GET'&&path==='/api/news/sync';
