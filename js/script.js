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

            tablaUsuarios.appendChild(fila)

        });
    })
}