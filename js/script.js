function cargarUsuarios(){
    fetch('http://localhost:3000/obtenerUsuarios')
    .then((res)=> res.json())
    .then((datos)=>{
        const tablaUsuarios=document.getElementById('tablaUsuarios')
        tablaUsuarios.innerHTML=''
        datos.forEach(usuario => {
            const fila =document.createElement('tr')

            const celdaCodigo=document.createElement('td')
            celdaCodigo.textContent=usuario.Codigo_mujer
            fila.appendChild(celdaCodigo)

            const tipoDocumento=document.createElement('td')
            tipoDocumento.textContent=usuario.tipo_documento
            fila.appendChild(tipoDocumento)

            const documento=document.createElement('td')
            documento.textContent=usuario.documento
            fila.appendChild(documento)

            const nombreUsu=document.createElement('td')
            nombreUsu.textContent=usuario.nombre_usu
            fila.appendChild(nombreUsu)

            const apellido=document.createElement('td')
            apellido.textContent=usuario.Apellidos
            fila.appendChild(apellido)

            const telefono=document.createElement('td')
            telefono.textContent=usuario.Telefono
            fila.appendChild(telefono)

            const email=document.createElement('td')
            email.textContent=usuario.Email
            fila.appendChild(email)

            const accion=document.createElement('td')
            
            const botonEliminar=document.createElement('button')
            botonEliminar.textContent='Eliminar'
            botonEliminar.onclick=()=> eliminarUsuario(usuario)
            accion.appendChild(botonEliminar)
            fila.appendChild(accion)

            
            const botonActualizar=document.createElement('button')
            botonActualizar.textContent='Actualizar'
            accion.appendChild(botonActualizar)
            fila.appendChild(accion)


            tablaUsuarios.appendChild(fila)

        });
    })
}

function eliminarUsuario(usuario) {
    fetch('http://localhost:3000/eliminarUsuario', {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify({usuarioId: usuario.Codigo_mujer })
    })
    .then((res)=> res.json())
    .then((datos)=>{

    })
    
}