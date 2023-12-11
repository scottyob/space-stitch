"use client";

export default function AComponent(props: {
  onClick: CallableFunction;
  text: string;
}) {
  return (
    <>
      <a onClick={(e) => props.onClick()}>{props.text}</a>
    </>
  );
}
