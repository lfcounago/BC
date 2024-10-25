//SPDX-License-Identifier: GPL-3.0 
pragma solidity ^0.8.10; 

contract  FabricaContract { 
    uint idDigits = 16;

    struct Producto{
        string nombre;
        uint identificacion;
    } 

    Producto[] public productos;

    mapping (uint => address) public productoAPropietario;
    mapping (address => uint) public propietarioProductos;

    function _crearProducto(string memory _nombre, uint _id) private{
        productos.push(Producto(_nombre, _id));    
        emit NuevoProducto(productos.length-1,_nombre,_id);
    }

    function _generarIdAleatorio(string memory _str) private view returns (uint){
        uint rand = uint(keccak256(abi.encodePacked(_str)));
        return rand % 10^idDigits;
    }

    function _crearProductoAleatorio(string memory _nombre) public{
        uint randId = _generarIdAleatorio(_nombre);
        _crearProducto(_nombre, randId);
    }

    event NuevoProducto(uint arrayProductoId, string nombre, uint id);

    function propiedad (uint productoId) public{
        productoAPropietario [productoId] = msg.sender; 
        propietarioProductos [msg.sender] = productoId; 
    }

    function getProductosPorPropietario(address _propietario) view external returns (uint [] memory){
        uint contador = 0;
        uint[] memory tempResultado = new uint[](productos.length);
        for (uint i = 0; i < productos.length; i++){
            uint _prod = productos[i].identificacion;
            address prodOwner = productoAPropietario[_prod];
            if (prodOwner == _propietario){
                tempResultado [contador] = _prod;
                contador++;
            }    
        }
        uint[] memory resultado = new uint[](contador);
        for (uint i = 0; i < contador; i++){resultado[i] = tempResultado[i];}
        return resultado;
    }
} 