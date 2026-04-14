import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { getSession } from '../../../../../lib/session';
import { prisma } from '../../../../../lib/prisma';
import QrPrintActions from './QrPrintActions';

export default async function QrLabelPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const idNum = Number(id);
  if (isNaN(idNum)) notFound();

  const ricambio = await prisma.ricambio.findUnique({
    where: { id: idNum },
    include: { demolitore: { select: { ragioneSociale: true } } },
  });
  if (!ricambio || ricambio.demolitoreid !== session.id) notFound();

  const qrDataUrl = await QRCode.toDataURL(ricambio.qrPayload, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href={`/dashboard/ricambi/${ricambio.id}`} className="text-sm text-gray-600 hover:text-gray-900">
            ← Torna al ricambio
          </Link>
          <QrPrintActions />
        </div>

        {/* Etichetta */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 print:border-2 print:border-black print:rounded-none print:shadow-none">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{ricambio.demolitore.ragioneSociale}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{ricambio.nome}</h1>
            <p className="text-sm text-gray-600 mb-6">
              {ricambio.marca} {ricambio.modello}{ricambio.anno ? ` · ${ricambio.anno}` : ''}
            </p>

            <img src={qrDataUrl} alt="QR code" className="w-64 h-64 mb-4" />

            <p className="font-mono text-lg font-bold text-gray-900 tracking-wider">{ricambio.codice}</p>

            <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Ubicazione</p>
                <p className="text-xl font-bold text-[#003580] font-mono">{ricambio.ubicazione}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Prezzo</p>
                <p className="text-xl font-bold text-gray-900">€ {Number(ricambio.prezzo).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4 print:hidden">
          Suggerimento: stampa su etichetta adesiva e applicala sul ricambio in magazzino.
        </p>
      </div>
    </div>
  );
}
