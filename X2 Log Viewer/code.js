'use strict';

function loadFile() {
   const file = document.querySelector( 'input' ).files[0];
   if ( ! file ) return;

   const reader = new FileReader();
   reader.onload = ( event ) => {
      let data = pako.inflate( event.target.result ).buffer;
      data = new TextDecoder( 'utf-8' ).decode( new DataView( data ) );
      data = cleanup( data );
      data = JSON.parse( data ).map( line => { try {
         return JSON.parse( line ); 
      } catch ( error ) {
         return { error };
      } } );
      showInfo( file, data );
      showEvents( data );
   };
   reader.readAsArrayBuffer( file );
   
   function cleanup ( data ) {
      data = data.replace( /Xenonauts\.GroundCombat\.Systems\.ActionRecorderSystem\+/g, '' );
      data = data.replace( /Xenonauts\.GroundCombat\.(Events\.)?/g, '' );
      data = data.replace( /ReactionResponseEvent\b/g, '' );
      data = data.replace( /,\\"\$type\\":\\"System\.Collections\.Generic\.List`1\[\[CoverInfo, Assembly-CSharp, Version=0\.0\.0\.0, Culture=neutral, PublicKeyToken=null\]\]\\"/g, '' );
      data = data.replace( /,\\"\$type\\":\\"Artitas\.GlobalEntity\\"/g, '' );
      return data;
   }

   function showInfo ( file, log ) {
      const display = document.querySelectorAll( '#summary td' );
      display[0].textContent = file.name;
      display[1].textContent = new Date( file.lastModified ).toISOString();
      display[2].textContent = log[0].Random[0];
      display[4].textContent = log.length;
   }

   function showEvents ( log ) {
      const main = document.querySelector( '#events tbody' ), t = '$type';
      let html = '', turn = 1;
      main.innerHTML = '';
      
      log.forEach( ( line, i ) => {
         let command, guard = line.Guard, event = line.Event, rand = line.Random || [,,];

         html += `<tr><td>${i}<td>${turn}<td>${rand[1]},${rand[2]}<td>`;

         delete line[t];
         delete line.Random;
         delete line.Guard;
         delete line.Event;
         if ( Object.keys( line ).length ) console.warn( "Unknown log prop" );

         if ( guard ) {
            if ( ! [ 'TerminatorGuard', 'EventsGuard' ].includes( guard[t] ) )
               html += guard[t] + '<br>';
            if ( guard.WaitOn )
               html += guard.WaitOn.map( txt => txt.replace( /(To)?Event$/g, '' ) ).join( ',<br>' );
            delete guard[t];
            delete guard.WaitOn;
            if ( Object.keys( guard ).length ) console.warn( "Unknown Guard prop" );
         }

         if ( ! event ) {
            html += `<td>${line[t]}<td><td>`;
            html += showDetails( line );
            if ( Object.keys( line ).length )
               html += JSON.stringify( line );

         } else {
            let command = ( event.UserInitiated ? '[PC] ' : '[AI] ' ) + event[t].replace( /(ToEvent|Event |Event|Command)$/, '' );
            let actor = event.Actor || event.Overwatcher;
            if ( actor && actor['$content'] )
               actor = actor['$content'];
            else if ( actor && actor['$ref'] )
               actor = '$ref' + actor['$ref'];
            else
               actor = actor ? JSON.stringify( actor ) : '';

            html += `<td>${command}<td>${actor}<td>`;
            delete event[t];
            delete event.UserInitiated;
            delete event.Consumed;
            delete event.Actor;
            delete event.Overwatcher;
            html += showDetails( event );
            
            if ( command.endsWith( 'PlayerPassTurn' ) )
               ++turn;
         }
      } );
      main.insertAdjacentHTML( 'beforeend', html );
      document.querySelectorAll( '#summary td' )[3].textContent = turn;
   }

   function showDetails( event ) {
      let html = '';
      if ( event.Conflict ) {
         if ( Object.keys( event ).length > 1 ) console.warn( "Additional conflicts" );
         event = event.Conflict;
      }
      if ( Object.keys( event ).length ) {
         html += '<table>';
         for ( var prop in event )
            html += `<tr><th>${prop}<td>` + JSON.stringify( event[prop] );
         html += '</table>';
      }
      return html;
   }
}

loadFile();