import SpacesTabledResults from "@/containers/spaces-table";

const SpacePage = () => {

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-semibold">Spaces: </h1>
            </div>
            <SpacesTabledResults/>
        </div>
    )
}
export default SpacePage;