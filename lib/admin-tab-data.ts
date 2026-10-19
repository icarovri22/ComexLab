/** A tab can render only a response fetched for that exact tab.
 * This guards the render that occurs before useEffect clears the previous response.
 */
export type AdminTabResponse<T extends string,P>={tab:T;payload:P};

export function currentAdminTabData<T extends string,P>(
 selectedTab:T,loaded:AdminTabResponse<T,P>|null
):P|null{
 return loaded?.tab===selectedTab?loaded.payload:null;
}
