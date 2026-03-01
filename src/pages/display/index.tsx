import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const invoices = [
    {
        branch: "INV001",
        name: "Paid",
        email: "Paid",
        location: "Paid",
        description: "Paid",
        openTime: "Paid",
        closeTime: "$250.00",
        openDays: "Credit Card",
    },
    {
        branch: "INV002",
        name: "Pending",
        email: "Pending",
        location: "Pending",
        description: "Pending",
        openTime: "Pending",
        closeTime: "$150.00",
        openDays: "PayPal",
    },
    {
        branch: "INV003",
        name: "Unpaid",
        email: "Unpaid",
        location: "Unpaid",
        description: "Unpaid",
        openTime: "Unpaid",
        closeTime: "$350.00",
        openDays: "Bank Transfer",
    },
    {
        branch: "INV004",
        name: "Paid",
        email: "Paid",
        location: "Paid",
        description: "Paid",
        openTime: "Paid",
        closeTime: "$450.00",
        openDays: "Credit Card",
    },
    {
        branch: "INV005",
        name: "Paid",
        email: "Paid",
        location: "Paid",
        description: "Paid",
        openTime: "Paid",
        closeTime: "$550.00",
        openDays: "PayPal",
    },
    {
        branch: "INV006",
        name: "Pending",
        email: "Pending",
        location: "Pending",
        description: "Pending",
        openTime: "Pending",
        closeTime: "$200.00",
        openDays: "Bank Transfer",
    },
    {
        branch: "INV007",
        name: "Unpaid",
        email: "Unpaid",
        location: "Unpaid",
        description: "Unpaid",
        openTime: "Unpaid",
        closeTime: "$300.00",
        openDays: "Credit Card",
    },
]

const DisplayPage = () => {
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">Spaces: </h1>

            </div>
            <div

                className=
                "rounded-md border max-w-full overflow-x-auto w-auto"
            >
                <Table>
                    {/* <TableCaption>Data of Spaces with there operators.</TableCaption> */}
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Branch</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead >Location</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>OpenTime</TableHead>
                            <TableHead>CloseTime</TableHead>
                            <TableHead>OpenDays</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.branch}>
                                <TableCell className="font-medium">{invoice.branch}</TableCell>
                                <TableCell>{invoice.name}</TableCell>
                                <TableCell>{invoice.email}</TableCell>
                                <TableCell >{invoice.location}</TableCell>
                                <TableCell >{invoice.description}</TableCell>
                                <TableCell >{invoice.openTime}</TableCell>
                                <TableCell >{invoice.closeTime}</TableCell>
                                <TableCell >{invoice.openDays}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    {/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
                </Table>

            </div>
        </div>
    )
}
export default DisplayPage;