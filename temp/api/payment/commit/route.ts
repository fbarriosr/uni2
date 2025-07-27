
import { NextRequest, NextResponse } from 'next/server';
import { WebpayPlus } from 'transbank-sdk';
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';

async function handleCommit(req: NextRequest) {
    const origin = req.nextUrl.origin;
    const searchParams = req.nextUrl.searchParams;
    let formData: FormData | null = null;

    if (req.method === 'POST') {
        try {
            formData = await req.formData();
        } catch (e) {
            console.warn("Could not parse form data, likely an empty body or network issue. Will check URL params.", e);
        }
    }

    const getValue = (key: string): string | null => {
        const formValue = formData?.get(key);
        if (formValue !== null && formValue !== undefined) {
            return formValue as string;
        }
        return searchParams.get(key);
    }

    const token_ws = getValue('token_ws');
    const tbk_token = getValue('TBK_TOKEN');
    const tbk_orden_compra = getValue('TBK_ORDEN_COMPRA');
    const tbk_id_sesion = getValue('TBK_ID_SESION'); // This is the session ID on cancellation

    if (tbk_token) { // User cancelled the payment on Transbank's page
        const orderToCancel = tbk_orden_compra || '';
        const sessionToCancel = tbk_id_sesion || '';

        // Try to update the transaction status to cancelled using session ID
        if (sessionToCancel) {
             try {
                const transactionRef = doc(db, 'transactions', sessionToCancel);
                await updateDoc(transactionRef, { status: 'cancelled_by_user' });
             } catch (e) {
                console.error("Failed to update transaction status to cancelled using session ID:", e);
             }
        }
        return NextResponse.redirect(`${origin}/payment/error?reason=cancelled&order=${orderToCancel}`);
    }

    if (token_ws) { // User is returning from a payment attempt
        try {
            const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
            const commitResponse = await tx.commit(token_ws);
            const { buy_order: buyOrder, session_id: sessionId, status, amount } = commitResponse;

            // The session_id is our Firestore document ID. This is the correct way to reference it.
            const transactionRef = doc(db, 'transactions', sessionId);

            if (status === 'AUTHORIZED') {
                const transactionSnap = await getDoc(transactionRef);
                if (transactionSnap.exists()) {
                    const batch = writeBatch(db);
                    
                    batch.update(transactionRef, {
                        status: 'successful',
                        transbankResponse: { ...commitResponse }
                    });

                    const { userId, salidaId, activityIds, couponCode } = transactionSnap.data();

                    if (userId && salidaId && Array.isArray(activityIds) && activityIds.length > 0) {
                        activityIds.forEach((activityId: string) => {
                            const activityRequestRef = doc(db, 'users', userId, 'salidas', salidaId, 'actividades', activityId);
                            batch.update(activityRequestRef, { paid: true });
                        });
                    }

                    // If a coupon was used, increment its usage count
                    if (couponCode) {
                        const couponQuery = await getDocs(query(collection(db, 'coupons'), where('code', '==', couponCode)));
                        if (!couponQuery.empty) {
                            const couponDoc = couponQuery.docs[0];
                            batch.update(couponDoc.ref, { timesUsed: increment(1) });
                        }
                    }
                    
                    await batch.commit();
                    
                    // Redirect to a public success page that then links to the match page.
                    // This allows the client-side auth state to stabilize before hitting an auth-protected route.
                    const redirectUrl = `${origin}/payment/success?order=${buyOrder}&amount=${amount}${salidaId ? `&salidaId=${salidaId}` : ''}`;
                    return NextResponse.redirect(redirectUrl);

                } else {
                     // This case is unlikely but good to handle: Transbank confirmed but we can't find the session.
                    console.error(`Could not find transaction document for session_id: ${sessionId}`);
                    return NextResponse.redirect(`${origin}/payment/error?reason=session_not_found&order=${buyOrder}`);
                }
            } else {
                 // Payment was not authorized (e.g., rejected by bank)
                 await updateDoc(transactionRef, { status: 'failed', transbankResponse: { ...commitResponse } });
                 return NextResponse.redirect(`${origin}/payment/error?reason=commit_failed&order=${buyOrder}`);
            }
        } catch (error) {
            console.error("Error committing Transbank transaction:", error);
            // This might happen if token_ws is invalid or expired
            return NextResponse.redirect(`${origin}/payment/error?reason=commit_exception`);
        }
    }

    // Fallback if no valid tokens are found
    return NextResponse.redirect(`${origin}/payment/error?reason=invalid_request`);
}


export async function POST(req: NextRequest) {
    return handleCommit(req);
}

export async function GET(req: NextRequest) {
    return handleCommit(req);
}
