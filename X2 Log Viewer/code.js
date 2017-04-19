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
      let htmltxt = '', turn = 1;
      main.innerHTML = '';

      log.forEach( ( line, i ) => {
         let command, guard = line.Guard, event = line.Event, rand = line.Random || [,,], html = '';

         html += `<tr><td>${i}<td>${turn}<td>${rand[1]},${rand[2]}<td>`;

         delete line[t];
         delete line.Random;
         delete line.Guard;
         delete line.Event;
         if ( hasProp( line ) ) console.warn( "Unknown log prop" );

         if ( guard ) {
            if ( ! [ 'TerminatorGuard', 'EventsGuard' ].includes( guard[t] ) )
               html += guard[t] + '<br>';
            if ( guard.WaitOn )
               html += guard.WaitOn.map( txt => txt.replace( /(To)?Event$/g, '' ) ).join( ',<br>' );
            delete guard[t];
            delete guard.WaitOn;
            if ( hasProp( guard ) ) console.warn( "Unknown Guard prop" );
         }

         if ( ! event ) {
            html += `<td>${line[t]||''}<td><td>`;
            html += showDetails( line );

         } else {
            let command = ( event.UserInitiated ? '[PC] ' : '[AI] ' ) + event[t].replace( /(ToEvent|Event |Event|Command)$/, '' );
            let actor = event.Actor || event.Overwatcher;
            if ( actor && actor['$content'] )
               actor = actor['$content'];
            else if ( actor && actor['$ref'] )
               actor = '$ref' + actor['$ref'];
            else
               actor = actor ? JSON.stringify( actor ) : '';

            if ( ! event.UserInitiated )
               html = html.replace( /^<tr\b/, '<tr class="AI"' );
            html += `<td>${command}<td>${actor}<td>`;
            delete event[t];
            delete event.UserInitiated;
            delete event.Consumed;
            delete event.Actor;
            delete event.Overwatcher;
            htmltxt += html + showDetails( event );

            if ( command.endsWith( 'PlayerPassTurn' ) )
               ++turn;
         }
      } );
      main.insertAdjacentHTML( 'beforeend', htmltxt );
      document.querySelectorAll( '#summary td' )[3].textContent = turn;
   }

   function showDetails( event ) {
      let html = '';
      event = trimLayer( event );
      if ( hasProp( event ) ) {
         html += '<table>';
         html += listDetails( event );
         html += '</table>';
      }
      return html;
   }

   function listDetails( obj ) {
      let html = '';
      for ( var prop in obj ) {
         html += `<tr><th>${prop}<td>`;
         const val = trimLayer( obj[prop] );
         if ( Array.isArray( val ) )
            html += '{[' + val.map( JSON.stringify ).join( ',<br>' ) + ']}';
         else
            html += JSON.stringify( obj[prop] );
      }
      return html;
   }

   function hasProp( obj ) {
      return Object.keys( obj ).length
   }

   function trimLayer( obj ) {
      if ( obj && typeof( obj ) === 'object' && hasProp( obj ) === 1 )
         for ( var prop in obj )
            if ( typeof( obj[ prop ] ) === 'object' )
                 return obj[prop];
      return obj;
   }
}

loadFile();