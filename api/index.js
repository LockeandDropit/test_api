import express from "express";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000; //add your port here

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import Stripe from "stripe";

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.post("/create-payment-intent", async (req, res) => {
  console.log("this is body", req.body);

  const setPrice = req.body.price;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: setPrice, //lowest denomination of particular currency
      currency: "usd",
      payment_method_types: ["card"], //by default
    });

    const clientSecret = paymentIntent.client_secret;

    // res.json("this is the body")

    res.json({
      clientSecret: clientSecret,
    });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
});

app.post("/test", async (req, res) => {
  // const { body } = req
  console.log("test complete");
  // console.log(req.body);
});

app.post("/create-stripe-account", async (req, res) => {
  // console.log("coming through?",req)
  try {
    //create account

    const account = await stripe.accounts.create({
      country: "US",
      type: "express",
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: {
          requested: true,
        },
        tax_reporting_us_1099_k: {
          requested: true,
        },
      },
    });

    //create account link

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://main--courageous-begonia-a876a4.netlify.app/",
      return_url: "https://main--courageous-begonia-a876a4.netlify.app/",
      type: "account_onboarding",
    });

    res.json({
      accountLink: accountLink,
      accountID: account.id,
    });
    console.log(JSON.stringify(accountLink));
    console.log(JSON.stringify(account.id));
    console.log(JSON.stringify(account));
    console.log("hit");
  } catch (err) {
    console.log(err);
    res.send({ error: err });
  }
});

//verify stripe account is complete
app.post("/verify-stripe-account", async (req, res) => {
  //consume accountID from FB
  const stripeID = req.body.id;

  const account = await stripe.accounts.retrieve(stripeID);

  console.log("this is whole body", account);
  console.log(
    "this is to check if account is verified payments",
    account.charges_enabled
  );
  console.log(
    "this is to check if account is verified payments",
    account.payouts_enabled
  );

  res.json({
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });
});

const testPrice = { price: 1000 };

app.post("/create-checkout", async (req, res) => {
  console.log("This is the job info", req.body[0]);

  const hiredApplicantStripeID = req.body[0].workerStripeID;
  const confirmedPrice = parseInt(req.body[1].confirmedPrice);
  // const applicationFee = req.body[2].applicationFee;
  const applicationFee = parseInt(req.body[1].confirmedPrice * 0.1)

  console.log(applicationFee, confirmedPrice)

  

  const session = await stripe.checkout.sessions.create({
    success_url: "https://shimmering-snickerdoodle-9c6d0b.netlify.app/",
    cancel_url: "https://shimmering-snickerdoodle-9c6d0b.netlify.app/",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Service Provided",
          },
          unit_amount: confirmedPrice,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_intent_data: {
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: hiredApplicantStripeID
      }
    }
  });

  // return session

  console.log(session.url);

  res.json({ session: session });
});
