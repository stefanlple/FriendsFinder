export const transformNumber = ( number ) => {
    if ( !number ) {
        return;
    }
    if ( number.startsWith( "+" ) ) {
        number = "0" + number.substring( 3 );
    }
    return number.replaceAll( " ", "" );
};