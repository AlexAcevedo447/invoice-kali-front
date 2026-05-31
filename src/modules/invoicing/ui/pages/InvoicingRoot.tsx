import { InvoicesSummary } from '@modules/invoicing/ui/components/InvoicesSummary'
import { CreateInvoiceForm } from '@modules/invoicing/ui/forms/CreateInvoiceForm'

export const InvoicingRoot = () => {
    return (
        <section>
            <InvoicesSummary />
            <CreateInvoiceForm />
        </section>
    )
}
