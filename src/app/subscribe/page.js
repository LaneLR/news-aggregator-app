import PaymentDetailsForm from "@/components/PaymentDetailsForm";

export default function SubscribePage() {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: 'column',
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: '100%',
          flexGrow: "1",
        }}
      >
        <h1>Payment Information</h1>
        <br />
        <PaymentDetailsForm />
      </div>
    </>
  );
}
