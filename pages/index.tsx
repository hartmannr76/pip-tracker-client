import App from '../src/App';

const Index = ({init}) => {
    return <App />
}

export function getStaticProps() {
    return {props: {init: true}};
};

export default Index;