const { AWS_REGION, TABLE_JOB } = process.env;
import {
  ExpenseDocument,
  GetDocumentAnalysisCommand,
  GetDocumentAnalysisResponse,
  GetExpenseAnalysisCommand,
  LineItemGroup,
  TextractClient,
} from '@aws-sdk/client-textract';
import {
  ExpenseField,
  LineItemFields,
} from '@aws-sdk/client-textract/dist-types/models/models_0';
import { Block } from '@aws-sdk/client-textract/models/models_0';
import { SQSEvent } from 'aws-lambda';
import {
  DocumentAnalysisLineItem,
  DocumentAnalysisMetadata,
  EntityType,
} from 'dependency-layer/API';
import { queryRecords } from 'dependency-layer/dynamoDB';
import { queryOpenSearch } from 'dependency-layer/openSearch';
import { DateTime } from 'luxon';

const textExtract = new TextractClient({ region: AWS_REGION });

const expenseFieldMapping = {
  VENDOR_ABN_NUMBER: 'newContact.taxNumber',
  INVOICE_RECEIPT_ID: 'task.reference',
  DUE_DATE: 'task.dueAt',
  PAYMENT_TERMS: 'task.noteForSelf',
  TOTAL: 'task.amount',
  AMOUNT_DUE: 'task.amount',
  SHIPPING_HANDLING_CHARGE: 'task.shippingAmount',
  //DESCRIPTION: 'task.lineItem.description',
  //QUANTITY: 'task.lineItem.quantity',
  //PRICE: 'task.lineItem.price',
  //UNIT_PRICE: 'task.lineItem.unitPrice',
  //PRODUCT_CODE: 'task.lineItem.code'
};

//const queryFieldMapping = {
//  BANK_BSB: 'payment.bank.routingNumber',
//  BANK_ACCOUNT: 'payment.bank.accountNumber',
//  BPAY_BILLER: 'payment.bpay.billerCode',
//  BPAY_REFERENCE: 'payment.bpay.referenceNumber',
//};

interface QueryBlock extends Block {
  Query?: {
    Alias?: string;
  };
}

const setNestedProperty = (obj: any, path: string, value: any) => {
  const keys = path.split('.');
  let current = obj;

  while (keys.length > 1) {
    const key = keys.shift();
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[0]] = value;
};

const getQueryValue = (getResponse, alias: string) => {
  const block = getResponse?.Blocks?.find(
    (block: QueryBlock) =>
      block.BlockType === 'QUERY' && block.Query?.Alias === alias
  );

  if (block) {
    const relationshipIds = block?.Relationships?.[0]?.Ids;
    if (relationshipIds) {
      const relatedBlock = getResponse?.Blocks?.find((block: Block) =>
        relationshipIds?.includes(block.Id)
      );

      if (relatedBlock) {
        //extractedData[queryFieldMapping[alias]] = relatedBlock.Text;
        return relatedBlock.Text;
      }
    } else {
      console.log('Related block not found');
    }
  } else {
    console.log(`${alias} block not found`);
  }

  return null;
};

const convertCurrencyToInteger = (currency: string): number => {
  // Remove any non-numeric characters except the decimal point
  const cleanedString = currency.replace(/[^0-9.]/g, '');

  // Convert the cleaned string to a float
  const floatValue = parseFloat(cleanedString);

  // Multiply by 100 to get the integer representation in cents
  const integerValue = Math.round(floatValue * 100);

  return integerValue;
};

function parseDateToSydneyISO(dateString: string): string {
  console.log('dateString: ', dateString);
  const parsedDate = Date.parse(dateString);
  console.log('parsedDate: ', parsedDate);
  if (isNaN(parsedDate)) {
    return '';
  }

  const sydneyTime =
    DateTime.fromMillis(parsedDate).setZone('Australia/Sydney');
  return sydneyTime.toISO() ?? '';
}

export const handler = async (event: SQSEvent) => {
  console.log('event: ', event);
  for (const record of event.Records) {
    console.log('record: ', JSON.stringify(record));

    const body = JSON.parse(record.body);
    console.log('body: ', body);
    const message = JSON.parse(body.Message);
    console.log('message: ', message);

    if (message.Status === 'SUCCEEDED') {
      const extractedData: Partial<DocumentAnalysisMetadata> = {
        task: {
          __typename: 'DocumentAnalysisTask',
        },
        payment: {
          bank: {
            __typename: 'ContactBankAccount',
          },
          bpay: {
            __typename: 'ContactBpay',
          },
        },
        newContact: {
          __typename: 'DocumentAnalysisContact',
        },
        potentialContacts: [],
        matchedContact: null,
      };

      const jobId = message.JobId;
      console.log('jobId: ', jobId);
      const getParams = {
        JobId: jobId,
      };
      console.log('getParams: ', getParams);

      let jobRecord;
      try {
        const data = await queryRecords({
          tableName: TABLE_JOB ?? '',
          indexName: 'jobsByJobId',
          keys: { jobId },
          limit: 1,
        });
        jobRecord = data?.[0];
        console.log('ocr job record: ', jobRecord);
      } catch (err: any) {
        console.log('ERROR: query job records: ', err);
        throw new Error(err.message);
      }

      // expense analysis
      if (message.API === 'StartExpenseAnalysis') {
        const getCommand = new GetExpenseAnalysisCommand(getParams);
        console.log('getCommand: ', getCommand);

        try {
          const getResponse = await textExtract.send(getCommand);
          console.log(
            'GetExpenseAnalysis response: ',
            JSON.stringify(getResponse)
          );

          getResponse?.ExpenseDocuments?.forEach((doc: ExpenseDocument) => {
            console.log('ExpenseDocument: ', doc);
            // specific fields
            let abn, total, amount;

            doc?.SummaryFields?.forEach((field: ExpenseField) => {
              switch (field.Type?.Text) {
                case 'VENDOR_ABN_NUMBER':
                  // remove whitespace and hyphens
                  console.log(
                    `${field.Type?.Text}: `,
                    field.ValueDetection?.Text
                  );
                  if (field.ValueDetection?.Text) {
                    abn =
                      field.ValueDetection?.Text?.replace(/\s|-/g, '') ?? '';
                    console.log('abn: ', abn);
                    setNestedProperty(
                      extractedData,
                      expenseFieldMapping[field.Type.Text],
                      abn
                    );
                  }
                  break;
                case 'DUE_DATE':
                  console.log(
                    `${field.Type?.Text}: `,
                    field.ValueDetection?.Text
                  );
                  if (field.ValueDetection?.Text) {
                    const date = parseDateToSydneyISO(
                      field.ValueDetection.Text
                    );
                    setNestedProperty(
                      extractedData,
                      expenseFieldMapping[field.Type.Text],
                      date
                    );
                  }
                  break;
                case 'TOTAL':
                  console.log(
                    `${field.Type?.Text}: `,
                    field.ValueDetection?.Text
                  );
                  if (field.ValueDetection?.Text) {
                    total = convertCurrencyToInteger(field.ValueDetection.Text);
                    setNestedProperty(
                      extractedData,
                      expenseFieldMapping[field.Type.Text],
                      total
                    );
                  }
                  break;
                case 'AMOUNT_DUE':
                  console.log(
                    `${field.Type?.Text}: `,
                    field.ValueDetection?.Text
                  );
                  if (field.ValueDetection?.Text) {
                    amount = convertCurrencyToInteger(
                      field.ValueDetection?.Text
                    );
                    setNestedProperty(
                      extractedData,
                      expenseFieldMapping[field.Type.Text],
                      amount
                    );
                  }
                  break;
                case 'SHIPPING_HANDLING_CHARGE':
                  console.log(
                    `${field.Type?.Text}: `,
                    field.ValueDetection?.Text
                  );
                  if (field.ValueDetection?.Text) {
                    const shippingAmount = convertCurrencyToInteger(
                      field.ValueDetection?.Text
                    );
                    setNestedProperty(
                      extractedData,
                      expenseFieldMapping[field.Type.Text],
                      shippingAmount
                    );
                  }
                  break;
                case 'INVOICE_RECEIPT_ID':
                case 'PAYMENT_TERMS':
                  console.log(
                    `${field.Type?.Text}: `,
                    field.ValueDetection?.Text
                  );
                  setNestedProperty(
                    extractedData,
                    expenseFieldMapping[field.Type.Text],
                    field.ValueDetection?.Text
                  );
                  break;
              }
            });

            // line items
            const lineItems: DocumentAnalysisLineItem[] = [];
            doc?.LineItemGroups?.forEach((items: LineItemGroup) => {
              items?.LineItems?.forEach((fields: LineItemFields) => {
                let quantity, description, unitPrice, price, productCode;

                fields?.LineItemExpenseFields?.forEach(
                  (expenseField: ExpenseField) => {
                    console.log('expenseField: ', expenseField);
                    switch (expenseField.Type?.Text) {
                      case 'QUANTITY':
                        quantity = expenseField?.ValueDetection?.Text;
                        console.log('quantity: ', quantity);
                        break;
                      case 'ITEM':
                        description = expenseField?.ValueDetection?.Text;
                        console.log('description: ', description);
                        break;
                      case 'UNIT_PRICE':
                        if (expenseField?.ValueDetection?.Text) {
                          unitPrice = convertCurrencyToInteger(
                            expenseField?.ValueDetection?.Text
                          );
                          console.log('unitPrice: ', unitPrice);
                        }
                        break;
                      case 'PRICE':
                        if (expenseField?.ValueDetection?.Text) {
                          price = convertCurrencyToInteger(
                            expenseField?.ValueDetection?.Text
                          );
                          console.log('price: ', price);
                        }
                        break;
                      case 'PRODUCT_CODE':
                        productCode = expenseField?.ValueDetection?.Text;
                        console.log('productCode: ', productCode);
                        break;
                    }
                  }
                );

                console.log('Quantity: ', quantity);
                console.log('Description: ', description);
                console.log('Unit Price: ', unitPrice);
                console.log('price: ', price);

                lineItems.push({
                  __typename: 'DocumentAnalysisLineItem',
                  quantity,
                  description,
                  unitPrice,
                  price,
                  productCode,
                });
              });
            });

            extractedData.task.lineItems = lineItems;
          });

          // Process the analysis results as needed
        } catch (err: any) {
          console.log('ERROR GetExpenseAnalysisCommand: ', err);
        }
      }

      // document analysis
      else if (message.API === 'StartDocumentAnalysis') {
        const getCommand = new GetDocumentAnalysisCommand(getParams);
        console.log('getCommand: ', getCommand);

        try {
          const getResponse: GetDocumentAnalysisResponse =
            await textExtract.send(getCommand);
          console.log(
            'GetDocumentAnalysis response: ',
            JSON.stringify(getResponse)
          );

          const bpayBiller = getQueryValue(getResponse, 'BPAY_BILLER');
          const bpayReference = getQueryValue(getResponse, 'BPAY_REFERENCE');
          const bankBsb = getQueryValue(getResponse, 'BANK_BSB');
          const bankAccount = getQueryValue(getResponse, 'BANK_ACCOUNT');

          if (bpayBiller && bpayBiller !== bankBsb) {
            extractedData.payment.bpay.billerCode = bpayBiller;
          }

          if (bpayBiller && bpayBiller !== bankBsb) {
            extractedData.payment.bpay.referenceNumber = bpayReference;
          }

          if (bankBsb) {
            extractedData.payment.bank.routingNumber = bankBsb;
          }

          if (bankAccount) {
            extractedData.payment.bank.accountNumber = bankAccount;
          }

          //Object.keys(queryFieldMapping).forEach((alias) => {
          //  const block = getResponse?.Blocks?.find(
          //    (block: QueryBlock) =>
          //      block.BlockType === 'QUERY' && block.Query?.Alias === alias
          //  );
          //
          //  if (block) {
          //    const relationshipIds = block?.Relationships?.[0]?.Ids;
          //    if (relationshipIds) {
          //      const relatedBlock = getResponse?.Blocks?.find((block: Block) =>
          //        relationshipIds?.includes(block.Id)
          //      );
          //
          //      if (relatedBlock) {
          //        //extractedData[queryFieldMapping[alias]] = relatedBlock.Text;
          //        setNestedProperty(
          //          extractedData,
          //          queryFieldMapping[alias],
          //          relatedBlock.Text
          //        );
          //      }
          //    } else {
          //      console.log('Related block not found');
          //    }
          //  } else {
          //    console.log(`${alias} block not found`);
          //  }
          //});
          // Process the analysis results as needed
        } catch (err: any) {
          console.log('ERROR GetDocumentAnalysisCommand: ', err);
        }
      }

      if (extractedData?.payment?.bpay?.billerCode) {
        // query for bpay entity
        const queryBody = {
          query: {
            bool: {
              must: [
                {
                  term: {
                    billerCode: extractedData.payment.bpay.billerCode,
                  },
                },
                {
                  term: {
                    type: EntityType.BPAY,
                  },
                },
              ],
            },
          },
        };

        let response;
        try {
          response = await queryOpenSearch({
            indexName: 'entity',
            body: queryBody,
          });
          console.log('Query result: ', response);

          if (response?.hits?.total?.value > 0) {
            extractedData.matchedEntity = response.hits.hits[0]._source;
          }
        } catch (error) {
          console.error('Failed to query entity index: ', error);
        }
      }

      // query for contact entity
      else if (extractedData?.newContact?.taxNumber) {
        const queryBody = {
          query: {
            bool: {
              must: [
                {
                  term: {
                    entityId: jobRecord.entityId,
                  },
                },
                {
                  term: {
                    taxNumber: extractedData.newContact.taxNumber,
                  },
                },
              ],
            },
          },
        };

        let response;
        try {
          response = await queryOpenSearch({
            indexName: 'contact',
            body: queryBody,
          });
          console.log('Query result: ', response);

          if (response?.hits?.total?.value > 0) {
            extractedData.matchedContact = response.hits.hits[0]._source;
          }
        } catch (error) {
          console.error('Failed to query contact index: ', error);
        }
      }

      console.log('extractedData: ', JSON.stringify(extractedData));
    }
  }
};
