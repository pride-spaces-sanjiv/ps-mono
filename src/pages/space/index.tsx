import SpacesTabledResults from "@/containers/spaces-table";

const SpacePage = () => {

    return (
        <div className="admin-page-shell">
            <div className="admin-page-header">
                <h1 className="text-2xl font-semibold">Centres: </h1>
            </div>
            <SpacesTabledResults/>
        </div>
    )
}
export default SpacePage;
