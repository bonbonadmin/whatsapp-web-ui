import {
  Container,
  EncryptionIcon,
  Link,
  Logo,
  LogoWrapper,
  Progress,
  SubTitle,
  Title,
} from "./styles";

type SplashPageProps = {
  progress: number;
};

export default function SplashPage(props: SplashPageProps) {
  const { progress } = props;

  return (
    <Container>
      {/* <LogoWrapper>
        <Logo id="whatsapp" />
      </LogoWrapper> */}
      <Progress progess={progress} />
      <Title>Message</Title>
      <SubTitle>
        <EncryptionIcon id="lock" /> End-to-end encrypted. Built by Jazim Abbas & Bonbon.
        {/* <Link href="https://github.com/jazimabbas" target="_blank">
          Jazim Abbas
        </Link>{" "}
        ❤️. */}
      </SubTitle>
    </Container>
  );
}
