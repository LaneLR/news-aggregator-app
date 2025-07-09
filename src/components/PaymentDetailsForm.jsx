"use client";
import styled from "styled-components";
import { useState } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";

const FormWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 90%;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export default function PaymentDetailsForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    cardNumber: "",
    expDate: "",
    cvv: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/fake-upgrade", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const data = await res.json();
    window.location.reload();
    router.push('/account')
    
  };

  return (
    <FormWrapper>
      <StyledForm onSubmit={handleSubmit}>
        <Input
          name="cardNumber"
          placeholder="Card Number"
          value={form.cardNumber}
          onChange={handleChange}
        />
        <Input
          name="expDate"
          placeholder="MM/YY"
          value={form.expDate}
          onChange={handleChange}
        />
        <Input
          name="cvv"
          placeholder="CVV"
          value={form.cvv}
          onChange={handleChange}
        />
        <Button type="submit">Submit</Button>
      </StyledForm>
    </FormWrapper>
  );
}
