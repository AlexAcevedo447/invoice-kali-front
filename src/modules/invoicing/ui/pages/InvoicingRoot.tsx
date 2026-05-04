import { InvoicesSummary } from '../components/InvoicesSummary'
import { CreateInvoiceForm } from '../forms'

export const InvoicingRoot = () => {
    return (
        <section>
            <InvoicesSummary />
            <CreateInvoiceForm />
        </section>
    )
}
