import { Link } from "react-router-dom";


const NotFound = () => {
    // const [count, setCount] = useState(0);
    return (
        <div>
            <h1>404</h1>
            <span>Retourner a la page d'<Link to="/">acceuil</Link></span>
        </div>
    );
}

export default NotFound;
