
'use server';

import { WebpayPlus } from 'transbank-sdk';
import { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } from 'transbank-sdk';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


export type CreateTransactionResponse = {
  success: boolean;
  url?: string;
  token?: string;
  message?: string;
};

export async function createWebpayTransaction(
  amount: number, 
  outingId: string,
  userId: string,
  activityIds: string[],
  couponCode?: string
): Promise<CreateTransactionResponse> {
  const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
  
  const requestHeaders = headers();
  const origin = requestHeaders.get('origin');
  
  if (!origin) {
    return { success: false, message: "No se pudo determinar la URL de la aplicación." };
  }
  
  const returnUrl = `${origin}/api/payment/commit`;

  try {
    const transactionsRef = collection(db, 'transactions');
    const newTransactionDoc = await addDoc(transactionsRef, {
        userId,
        salidaId: outingId,
        amount,
        activityIds,
        couponCode: couponCode || null,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    // Use a combination of outing ID and a short timestamp to create a unique but length-limited buyOrder
    const shortTimestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const buyOrder = `${outingId.slice(0, 15)}-${shortTimestamp}`.slice(0, 26); // Ensure it's max 26 chars
    const sessionId = newTransactionDoc.id; 

    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);
    
    if (response.token && response.url) {
      return { success: true, url: response.url, token: response.token };
    } else {
      const tbkMessage = (response as any).error_message || "Could not get a valid response from Transbank.";
      return { success: false, message: tbkMessage };
    }

  } catch (error) {
    console.error("Error creating Transbank transaction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `An error occurred while communicating with Transbank: ${errorMessage}` };
  }
}
